import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createStore, useStore } from './store'
import {
  BUCKETS,
  getActiveAccountId,
  onBucketWrite,
  readAccountBucket,
  writeAccountBucket,
  readTombstones,
  writeTombstones,
  type Bucket,
  type Tombstone,
} from './storage'
import { reloadAll } from './reload'
import { openLocalProfileFor } from './auth'

/*
  CLOUD BACKUP AND SYNC — the one thing a browser-only app could never do.

  Until now every device was its own island: `signIn()` looks up the email in *that
  browser's* account list, so your phone and your laptop held two unrelated accounts
  with two unrelated histories, and the only bridge was a file you carried by hand.
  This is the bridge.

  THREE RULES IT KEEPS, all of them deliberate:

  1. LOCAL FIRST, LITERALLY. Every screen still reads localStorage. The cloud is a
     mirror behind it, never the source. Sign out, go offline, refuse the whole
     feature — the app is exactly what it was. If Pitchwork ever needs the network
     to show you a drill, this file has broken its promise.

  2. MERGE, NEVER OVERWRITE. Same rule the transfer file has always followed: rows
     are matched by id, both sides are unioned, and syncing twice adds nothing. No
     device's history can flatten another's, because nothing is ever replaced —
     only added, or explicitly tombstoned.

  3. A DELETE IS A FACT, NOT AN ABSENCE. If deleting were just "the row is gone",
     sync would be a union of two devices and every session you deleted on your
     phone would come straight back from your laptop. So deletions are recorded
     (see `readTombstones`) and travel as rows marked `deleted`.

  What syncs: your history, the drills you wrote, the sessions you built, and the
  challenges you started. Settings are backed up but only applied to a device that
  has never seen this account — the same call transfer.ts makes, for the same
  reason: the preferences you set *there* are the ones you meant.
*/

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Whether this build was given a project to talk to at all. */
export function isConfigured(): boolean {
  return Boolean(URL && ANON_KEY)
}

/*
  The client is loaded on demand, not imported at the top of the app. supabase-js is
  a sizeable dependency and the overwhelming majority of what Pitchwork does never
  needs it — making it part of the first paint would tax every offline session to
  pay for a feature that is opt-in.
*/
let clientPromise: Promise<SupabaseClient> | null = null
async function client(): Promise<SupabaseClient> {
  if (!isConfigured()) throw new CloudError('Cloud sync is not set up in this build.')
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(URL!, ANON_KEY!, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      }),
    )
  }
  return clientPromise
}

export class CloudError extends Error {}

// --- Who is signed in to the cloud ---

export interface CloudUser {
  id: string
  email: string
}

const userStore = createStore<CloudUser | null>(null)
const statusStore = createStore<SyncStatus>({ state: 'idle', at: null, message: null })

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'ok' | 'error'
  at: string | null
  message: string | null
}

export function useCloudUser(): CloudUser | null {
  return useStore(userStore)
}

export function useSyncStatus(): SyncStatus {
  return useStore(statusStore)
}

/*
  Restores an existing cloud session on boot, so a signed-in device stays signed in.
  Runs once from App; does nothing at all when the build has no project configured,
  which is what keeps an unconfigured build completely unaffected by this file.
*/
export function useCloudSession(): void {
  const [, force] = useState(0)

  useEffect(() => {
    if (!isConfigured()) return
    let cancelled = false

    void (async () => {
      const supabase = await client()
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      const session = data.session
      if (session?.user?.email) {
        userStore.set({ id: session.user.id, email: session.user.email })
        // Catch up with whatever the other device did while this one was closed.
        void sync().catch(() => undefined)
      }
      force((n) => n + 1)

      supabase.auth.onAuthStateChange((_event, next) => {
        userStore.set(
          next?.user?.email ? { id: next.user.id, email: next.user.email } : null,
        )
      })
    })()

    return () => {
      cancelled = true
    }
  }, [])
}

// --- Cloud accounts ---

export async function cloudSignUp(email: string, password: string): Promise<void> {
  const supabase = await client()
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw new CloudError(friendly(error.message))
}

export async function cloudSignIn(email: string, password: string): Promise<CloudUser> {
  const supabase = await client()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new CloudError(friendly(error.message))
  const user = data.user
  if (!user?.email) throw new CloudError('That sign-in came back without an account.')
  const cloudUser = { id: user.id, email: user.email }
  userStore.set(cloudUser)
  return cloudUser
}

/*
  The whole point, in one function: sign in on a device that has never seen this
  account and end up looking at your training.

  Order is load-bearing. The cloud is asked first, because if the password is wrong
  nothing local should change; then a local profile is opened or created so the app
  has a drawer to put things in; then the sync fills it. Doing the sync before
  opening the profile would write another account's rows into whichever drawer
  happened to be open.
*/
export async function restoreOnThisDevice(
  email: string,
  password: string,
  remember: boolean,
): Promise<SyncStatus> {
  await cloudSignIn(email, password)
  await openLocalProfileFor(email, password, remember)
  return sync()
}

/*
  Turning sync on for a profile that already exists — the laptop, in other words,
  where all the history currently is. The first sync pushes it up, which is what the
  phone then pulls down.
*/
export async function enableSyncHere(
  email: string,
  password: string,
  mode: 'sign-in' | 'sign-up',
): Promise<SyncStatus> {
  if (mode === 'sign-up') {
    await cloudSignUp(email, password)
    // Projects with email confirmation switched on give no session until the link is
    // clicked, so signing in here is what turns "account made" into "account usable".
    try {
      await cloudSignIn(email, password)
    } catch {
      throw new CloudError(
        'Account created. Check your email to confirm the address, then sign in here.',
      )
    }
  } else {
    await cloudSignIn(email, password)
  }
  return sync()
}

export async function cloudSignOut(): Promise<void> {
  const supabase = await client()
  await supabase.auth.signOut()
  userStore.set(null)
  statusStore.set({ state: 'idle', at: null, message: null })
}

/*
  The one thing a local-only lock could never offer. Sends a link; the app itself
  never sees the new password.
*/
export async function sendPasswordReset(email: string): Promise<void> {
  const supabase = await client()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + import.meta.env.BASE_URL,
  })
  if (error) throw new CloudError(friendly(error.message))
}

// Supabase's messages are written for developers; these are the ones people hit.
function friendly(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return "That email and password don't match an account."
  if (m.includes('already registered')) return 'There is already an account with that email. Sign in instead.'
  if (m.includes('email not confirmed')) return 'Check your email and confirm the address first.'
  if (m.includes('password should be')) return 'Use at least 8 characters.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'No connection. Your training is safe on this device; it will sync when you are back online.'
  return message
}

// --- The sync itself ---

export interface Row {
  bucket: Bucket
  id: string
  data: unknown
  deleted: boolean
}

/** Buckets that are lists of things with ids — everything except settings. */
const LIST_BUCKETS = BUCKETS.filter((b) => b !== 'settings')

function idOf(item: unknown): string | null {
  if (item && typeof item === 'object' && 'id' in item) {
    const id = (item as { id: unknown }).id
    if (typeof id === 'string') return id
  }
  return null
}

/*
  Push everything this device knows, pull everything the account knows, and leave
  both holding the union.

  Order matters: push first. If the pull came first and the connection died halfway,
  this device would have adopted the other one's rows without ever having sent its
  own — and a user who then cleared their browser would have lost exactly the
  sessions that had never left it.
*/
export async function sync(): Promise<SyncStatus> {
  if (!isConfigured()) return statusStore.get()
  const accountId = getActiveAccountId()
  const user = userStore.get()
  if (!accountId || !user) return statusStore.get()

  statusStore.set({ ...statusStore.get(), state: 'syncing', message: null })

  try {
    const supabase = await client()

    // --- what this device has ---
    const mine: Row[] = []
    for (const bucket of LIST_BUCKETS) {
      const list = readAccountBucket<unknown[]>(accountId, bucket, [])
      if (!Array.isArray(list)) continue
      for (const item of list) {
        const id = idOf(item)
        if (id) mine.push({ bucket, id, data: item, deleted: false })
      }
    }
    for (const stone of readTombstones(accountId)) {
      mine.push({ bucket: stone.bucket, id: stone.id, data: {}, deleted: true })
    }
    // Settings ride along as a backup for a device that has never seen this account.
    mine.push({
      bucket: 'settings',
      id: 'settings',
      data: readAccountBucket<unknown>(accountId, 'settings', {}),
      deleted: false,
    })

    if (mine.length > 0) {
      const { error } = await supabase.from('pitchwork_rows').upsert(
        mine.map((r) => ({
          user_id: user.id,
          bucket: r.bucket,
          id: r.id,
          data: r.data,
          deleted: r.deleted,
        })),
        { onConflict: 'user_id,bucket,id' },
      )
      if (error) throw new CloudError(friendly(error.message))
    }

    // --- what the account has ---
    const { data: remote, error: readError } = await supabase
      .from('pitchwork_rows')
      .select('bucket,id,data,deleted')
      .eq('user_id', user.id)
    if (readError) throw new CloudError(friendly(readError.message))

    applyRemote(accountId, (remote ?? []) as Row[])
    reloadAll()

    const status: SyncStatus = { state: 'ok', at: new Date().toISOString(), message: null }
    statusStore.set(status)
    return status
  } catch (error) {
    const status: SyncStatus = {
      state: 'error',
      at: statusStore.get().at,
      message: error instanceof Error ? friendly(error.message) : 'Sync failed.',
    }
    statusStore.set(status)
    return status
  }
}

/*
  Fold what came back into what is already here.

  Exported so it can be tested without a network: this is the function that can lose
  somebody's training, and it is worth far more scrutiny than the wire format around
  it.

  Union by id, remote never overwriting a local row that already exists — the two
  copies of a session are the same session, and the local one is the one this device
  has been reading all along. Tombstones win over both: a row deleted anywhere is
  deleted everywhere, and the tombstone is kept locally so this device does not
  re-upload the row it just removed.
*/
export function applyRemote(accountId: string, rows: Row[]): void {
  const tombstones: Tombstone[] = [...readTombstones(accountId)]
  const known = new Set(tombstones.map((t) => `${t.bucket}:${t.id}`))

  for (const row of rows) {
    if (!row.deleted) continue
    const key = `${row.bucket}:${row.id}`
    if (!known.has(key)) {
      known.add(key)
      tombstones.push({ bucket: row.bucket, id: row.id })
    }
  }
  writeTombstones(accountId, tombstones)

  for (const bucket of LIST_BUCKETS) {
    const local = readAccountBucket<unknown[]>(accountId, bucket, [])
    const list = Array.isArray(local) ? [...local] : []
    const seen = new Set(list.map((item) => idOf(item)).filter((id): id is string => id != null))

    for (const row of rows) {
      if (row.bucket !== bucket || row.deleted) continue
      if (seen.has(row.id)) continue
      if (known.has(`${bucket}:${row.id}`)) continue // deleted somewhere; do not resurrect
      seen.add(row.id)
      list.push(row.data)
    }

    const cleaned = list.filter((item) => {
      const id = idOf(item)
      return id == null || !known.has(`${bucket}:${id}`)
    })

    if (bucket === 'sessions') {
      cleaned.sort(
        (a, b) =>
          new Date((b as { completedAt: string }).completedAt).getTime() -
          new Date((a as { completedAt: string }).completedAt).getTime(),
      )
    }
    writeAccountBucket(accountId, bucket, cleaned)
  }

  // Settings: only for a device that has nothing of its own for this account yet.
  const existing = readAccountBucket<unknown>(accountId, 'settings', null)
  if (existing == null) {
    const remote = rows.find((r) => r.bucket === 'settings' && !r.deleted)
    if (remote) writeAccountBucket(accountId, 'settings', remote.data)
  }
}

/*
  Sync quietly in the background after something changed. Debounced, because
  finishing a session writes several times in a row and none of them is urgent —
  and failure here is silent on purpose: the training is already saved locally, so
  a dropped connection is not something to interrupt anyone about.
*/
let pending: ReturnType<typeof setTimeout> | null = null
export function syncSoon(delayMs = 4000): void {
  if (!isConfigured() || !userStore.get()) return
  if (pending) clearTimeout(pending)
  pending = setTimeout(() => {
    pending = null
    void sync().catch(() => undefined)
  }, delayMs)
}

/*
  Every write to this account's data offers to sync. Hooking storage itself rather
  than each individual save is what makes this hold: a feature added next year gets
  synced without anyone remembering to wire it up, which is the same reasoning that
  put deletions in `writeList`.
*/
onBucketWrite(() => syncSoon())

/*
  Pull again when the app comes back to the front. This is the case the whole feature
  exists for — you trained on your phone, you open your laptop, and the laptop has
  been sitting on a stale page since this morning.
*/
export function watchForeground(): void {
  if (!isConfigured()) return
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && userStore.get()) syncSoon(500)
  })
}
