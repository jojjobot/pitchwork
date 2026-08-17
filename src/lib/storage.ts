import type { ChallengeEnrolment, CompletedSession, Exercise, Workout } from '../types'

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

/*
  Everything an account owns, one drawer each. This list is the authority: anything
  added here is namespaced per account, exported with the account, and removed when
  the account is deleted, all without touching those functions.
*/
export type Bucket = 'sessions' | 'settings' | 'customWorkouts' | 'customExercises' | 'challenges'

export const BUCKETS: Bucket[] = [
  'sessions',
  'settings',
  'customWorkouts',
  'customExercises',
  'challenges',
]

// Where data lived before accounts existed. Claimed by the first account created.
// Only the buckets that predate the sign-in screen are in here — a bucket invented
// afterwards has no unnamespaced data to inherit.
const LEGACY_KEYS: Partial<Record<Bucket, string>> = {
  sessions: 'pitchwork.sessions.v1',
  settings: 'pitchwork.settings.v1',
  customWorkouts: 'pitchwork.customWorkouts.v1',
}

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

/*
  Something changed on disk. lib/cloud.ts registers here so a cloud-backed account
  pushes whatever just happened, and it is a callback rather than an import because
  cloud.ts already imports this file — the arrow only goes one way.

  Deliberately hung off `write` and not off `writeAccountBucket`: a sync applies what
  it pulled through the latter, and hooking both would have every sync trigger the
  next one forever.
*/
let onWrite: (() => void) | null = null

export function onBucketWrite(callback: () => void): void {
  onWrite = callback
}

function write(bucket: Bucket, value: unknown): void {
  const key = bucketKey(bucket)
  if (!key) return // signed out: never write someone's data into a nameless drawer
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or unavailable — nothing more we can do here
  }
  onWrite?.()
}

/*
  --- Deletions, written down ---

  A delete has to be a fact rather than an absence, or cloud sync cannot tell "I
  removed this session on my phone" apart from "my laptop has a session this device
  hasn't seen yet" — the two look identical, and guessing wrong either resurrects
  what you deleted or deletes what you just did.

  So every id that leaves a list is recorded here. This is deliberately NOT one of
  the BUCKETS: buckets are things you own, and a tombstone is bookkeeping. It is
  written by `writeList` below, which every list save goes through, so no delete
  path can forget to leave a note — including ones written later.
*/
export interface Tombstone {
  bucket: Bucket
  id: string
}

function tombstoneKey(accountId: string): string {
  return `pitchwork.${accountId}.tombstones.v1`
}

export function readTombstones(accountId: string): Tombstone[] {
  try {
    const raw = localStorage.getItem(tombstoneKey(accountId))
    const value = raw ? (JSON.parse(raw) as Tombstone[]) : []
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function writeTombstones(accountId: string, list: Tombstone[]): void {
  try {
    localStorage.setItem(tombstoneKey(accountId), JSON.stringify(list))
  } catch {
    // storage full or unavailable — nothing more we can do here
  }
}

/*
  Save a list, noting anything that just disappeared from it. Everything below that
  stores a list of things-with-ids goes through here rather than calling `write`.
*/
function writeList(bucket: Bucket, next: unknown[]): void {
  const accountId = activeAccountId
  if (accountId) {
    const before = read<unknown[]>(bucket, [])
    if (Array.isArray(before) && before.length > 0) {
      const surviving = new Set(
        next.map((item) => idOfItem(item)).filter((id): id is string => id != null),
      )
      const gone = before
        .map((item) => idOfItem(item))
        .filter((id): id is string => id != null && !surviving.has(id))

      if (gone.length > 0) {
        const stones = readTombstones(accountId)
        const known = new Set(stones.map((t) => `${t.bucket}:${t.id}`))
        for (const id of gone) {
          if (!known.has(`${bucket}:${id}`)) stones.push({ bucket, id })
        }
        writeTombstones(accountId, stones)
      }
    }
  }
  write(bucket, next)
}

function idOfItem(item: unknown): string | null {
  if (item && typeof item === 'object' && 'id' in item) {
    const id = (item as { id: unknown }).id
    if (typeof id === 'string') return id
  }
  return null
}

// --- Completed sessions (training history) ---

export function loadSessions(): CompletedSession[] {
  const value = read<CompletedSession[]>('sessions', [])
  return Array.isArray(value) ? value : []
}

// The whole list is written at once, and only ever by lib/sessions.ts — one write
// path means what's on screen and what's on disk can't disagree.
export function saveSessions(sessions: CompletedSession[]): void {
  writeList('sessions', sessions)
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
  writeList('customWorkouts', list)
}

// --- Drills you wrote yourself ---
// The 172 drills in src/data/exercises.ts ship with the app and never change. These
// are yours: same shape, same everything, just stored per account instead of built in.

export function loadCustomExercises(): Exercise[] {
  const value = read<Exercise[]>('customExercises', [])
  return Array.isArray(value) ? value : []
}

export function saveCustomExercises(list: Exercise[]): void {
  writeList('customExercises', list)
}

// --- Challenges you've started ---
// Two dates and an id each. Which days you actually did is never stored — it's read
// back out of your history, so this list can't outlive the training that earned it.

export function loadChallenges(): ChallengeEnrolment[] {
  const value = read<ChallengeEnrolment[]>('challenges', [])
  return Array.isArray(value) ? value : []
}

export function saveChallenges(list: ChallengeEnrolment[]): void {
  writeList('challenges', list)
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
  for (const [bucket, legacyKey] of Object.entries(LEGACY_KEYS) as [Bucket, string][]) {
    try {
      const raw = localStorage.getItem(legacyKey)
      if (raw == null) continue
      localStorage.setItem(accountBucketKey(accountId, bucket), raw)
      localStorage.removeItem(legacyKey)
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
  for (const bucket of BUCKETS) {
    try {
      localStorage.removeItem(accountBucketKey(accountId, bucket))
    } catch {
      // nothing to do
    }
  }
  // Tombstones aren't a bucket, so they need saying out loud — otherwise deleting an
  // account would leave a list of its deletions behind for the next account with
  // that id to trip over.
  try {
    localStorage.removeItem(tombstoneKey(accountId))
  } catch {
    // nothing to do
  }
}
