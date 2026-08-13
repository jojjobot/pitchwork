import type { CompletedSession, Workout } from '../types'

/*
  Everything Pitchwork keeps lives in this browser's localStorage. There is no
  server, so this file is the whole persistence layer.

  Each account gets its own namespace — `pitchwork.<accountId>.sessions.v1` and so
  on — which is what keeps two people on the same browser from seeing each other's
  training. Nothing here knows about passwords; it only knows whose drawer is open.
  lib/auth.ts decides that and calls setActiveAccount().
*/

// Who's signed in. Written to localStorage when "remember me" is on and to
// sessionStorage when it isn't — that single difference is the whole feature.
const SIGNED_IN_KEY = 'pitchwork.signedIn.v1'
export const ACCOUNTS_KEY = 'pitchwork.accounts.v1'

// Where data lived before accounts existed. Claimed by the first account created.
const LEGACY_KEYS = {
  sessions: 'pitchwork.sessions.v1',
  settings: 'pitchwork.settings.v1',
  customWorkouts: 'pitchwork.customWorkouts.v1',
} as const

export type Bucket = keyof typeof LEGACY_KEYS

export interface Settings {
  soundEnabled: boolean
  vibrationEnabled: boolean
  weeklyGoalMinutes: number
}

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  vibrationEnabled: true,
  weeklyGoalMinutes: 90,
}

// --- Whose data are we reading? ---

export interface SignedIn {
  accountId: string
  remember: boolean
}

function readSignedIn(): SignedIn | null {
  try {
    // Referenced inside the guard on purpose: this runs at module load, and in any
    // environment without Web Storage (a test runner, SSR) it must come up signed
    // out rather than take the whole app down on import.
    for (const store of [localStorage, sessionStorage]) {
      const raw = store.getItem(SIGNED_IN_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as SignedIn
        if (parsed && typeof parsed.accountId === 'string') return parsed
      }
    }
  } catch {
    // unreadable or unavailable — treat as signed out
  }
  return null
}

/*
  Resolved once, here, at module load — before any store initialises. The stores are
  module-level singletons that read their data on first import, so if this were
  decided later they'd all come up empty and only fill in after a refresh.
*/
let activeAccountId: string | null = readSignedIn()?.accountId ?? null

export function getActiveAccountId(): string | null {
  return activeAccountId
}

export function setActiveAccount(id: string | null): void {
  activeAccountId = id
}

export function rememberSignedIn(accountId: string, remember: boolean): void {
  const record: SignedIn = { accountId, remember }
  try {
    clearSignedIn()
    const store = remember ? localStorage : sessionStorage
    store.setItem(SIGNED_IN_KEY, JSON.stringify(record))
  } catch {
    // if we can't persist it, the sign-in simply won't outlive this page
  }
}

export function clearSignedIn(): void {
  try {
    localStorage.removeItem(SIGNED_IN_KEY)
    sessionStorage.removeItem(SIGNED_IN_KEY)
  } catch {
    // nothing to do
  }
}

export function isRemembered(): boolean {
  return readSignedIn()?.remember ?? false
}

// --- Reading and writing one account's data ---

function accountBucketKey(accountId: string, bucket: Bucket): string {
  return `pitchwork.${accountId}.${bucket}.v1`
}

function bucketKey(bucket: Bucket): string | null {
  return activeAccountId ? accountBucketKey(activeAccountId, bucket) : null
}

/*
  Reading and writing a *named* account's drawer rather than the open one.

  Only lib/transfer.ts should need this, and only because importing an account from
  another device happens on the sign-in screen, where nobody is signed in yet and
  activeAccountId is null. Everything else in the app must go through the functions
  below, which can only ever touch the account that's actually open.
*/
export function readAccountBucket<T>(accountId: string, bucket: Bucket, fallback: T): T {
  try {
    const raw = localStorage.getItem(accountBucketKey(accountId, bucket))
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeAccountBucket(accountId: string, bucket: Bucket, value: unknown): void {
  try {
    localStorage.setItem(accountBucketKey(accountId, bucket), JSON.stringify(value))
  } catch {
    // storage full or unavailable — the caller reports what did and didn't land
  }
}

function read<T>(bucket: Bucket, fallback: T): T {
  const key = bucketKey(bucket)
  if (!key) return fallback // signed out: the app is gated, so nothing should ask
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(bucket: Bucket, value: unknown): void {
  const key = bucketKey(bucket)
  if (!key) return // signed out: never write someone's data into a nameless drawer
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or unavailable — nothing more we can do here
  }
}

// --- Completed sessions (training history) ---

export function loadSessions(): CompletedSession[] {
  const value = read<CompletedSession[]>('sessions', [])
  return Array.isArray(value) ? value : []
}

// The whole list is written at once, and only ever by lib/sessions.ts — one write
// path means what's on screen and what's on disk can't disagree.
export function saveSessions(sessions: CompletedSession[]): void {
  write('sessions', sessions)
}

// --- Workouts you built yourself ---
// The programme in src/data/workouts.ts is read-only; anything you make is kept
// here. Reading and writing the whole list at once is fine — there will never be
// enough custom sessions for that to matter.

export function loadCustomWorkouts(): Workout[] {
  const value = read<Workout[]>('customWorkouts', [])
  return Array.isArray(value) ? value : []
}

export function saveCustomWorkouts(list: Workout[]): void {
  write('customWorkouts', list)
}

// --- Settings ---

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>('settings', {}) }
}

export function saveSettings(settings: Settings): void {
  write('settings', settings)
}

// --- Account housekeeping ---

/*
  Data from before accounts existed belongs to whoever creates the first account —
  otherwise adding a sign-in screen would look exactly like losing your history.
  Moved rather than copied, so a second account can't inherit it too.
*/
export function claimLegacyData(accountId: string): boolean {
  let claimed = false
  for (const bucket of Object.keys(LEGACY_KEYS) as Bucket[]) {
    try {
      const raw = localStorage.getItem(LEGACY_KEYS[bucket])
      if (raw == null) continue
      localStorage.setItem(`pitchwork.${accountId}.${bucket}.v1`, raw)
      localStorage.removeItem(LEGACY_KEYS[bucket])
      claimed = true
    } catch {
      // if it can't be moved, leave it where it is rather than lose it
    }
  }
  return claimed
}

export function hasLegacyData(): boolean {
  try {
    return Object.values(LEGACY_KEYS).some((key) => localStorage.getItem(key) != null)
  } catch {
    return false
  }
}

export function dropAccountData(accountId: string): void {
  for (const bucket of Object.keys(LEGACY_KEYS) as Bucket[]) {
    try {
      localStorage.removeItem(`pitchwork.${accountId}.${bucket}.v1`)
    } catch {
      // nothing to do
    }
  }
}
