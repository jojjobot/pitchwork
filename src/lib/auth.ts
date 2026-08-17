import { createStore, useStore } from './store'
import {
  ACCOUNTS_KEY,
  claimLegacyData,
  clearSignedIn,
  dropAccountData,
  getActiveAccountId,
  hasLegacyData,
  isRemembered,
  rememberSignedIn,
  setActiveAccount,
} from './storage'
import { reload as reloadSessions } from './sessions'
import { reload as reloadSettings } from './settings'
import { reload as reloadCustomWorkouts } from './customWorkouts'
import { reload as reloadCustomExercises } from './customExercises'
import { reload as reloadChallenges } from './challenges'
import { countEvent } from './analytics'

/*
  SIGNING IN — and being honest about what that means here.

  Pitchwork has no server. This is a lock on the front door, not a safe: it stops
  someone who picks up your phone from reading your training, and it keeps two
  people on one browser out of each other's history. It does NOT protect anything
  from someone who opens devtools — your sessions are stored as plain JSON, exactly
  as they were before accounts existed. Anything in the UI that implied otherwise
  would be a lie.

  What we do take seriously is the password itself, because people reuse them:
  it is never stored, and never recoverable. Only a PBKDF2-SHA-256 hash over a
  random per-account salt is kept, so the stored record is useless somewhere else.
*/

const ITERATIONS = 310_000 // OWASP's floor for PBKDF2-HMAC-SHA256; ~0.2–0.5s on a phone
const SALT_BYTES = 16
const KEY_BITS = 256

export interface Account {
  id: string
  email: string
  createdAt: string
  salt: string // base64
  hash: string // base64
  iterations: number // stored per account so this can be raised later without lockouts
}

// --- Reading and writing the account list ---

function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as Account[]) : []
  } catch {
    return []
  }
}

function saveAccounts(accounts: Account[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  } catch {
    // storage full or unavailable — the account simply won't persist
  }
}

const accountsStore = createStore(loadAccounts(), saveAccounts)

// Who is signed in right now. Resolved at load from whatever storage.ts restored,
// so a remembered sign-in is already in place before the first render.
const currentStore = createStore<Account | null>(
  accountsStore.get().find((a) => a.id === getActiveAccountId()) ?? null,
)

// A signed-in id pointing at an account that no longer exists is a dead session.
if (getActiveAccountId() && !currentStore.get()) {
  setActiveAccount(null)
  clearSignedIn()
}

export function useAccount(): Account | null {
  return useStore(currentStore)
}

export function useAccounts(): Account[] {
  return useStore(accountsStore)
}

export function getAccount(): Account | null {
  return currentStore.get()
}

export function accountCount(): number {
  return accountsStore.get().length
}

// An account is only an email — there is no name field to store one in. Rather than
// ask for a name we don't use anywhere else, the one we show is read off the address
// ("jo.boehle@…" → "Jo Boehle"): personal enough to greet you by, and impossible to
// leave out of sync. Anything unsplittable falls back to the address itself.
export function displayName(account: Account): string {
  const local = account.email.split('@')[0] ?? ''
  const words = local.split(/[._+-]+|\d+/).filter(Boolean)
  if (words.length === 0) return account.email
  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
}

export { isRemembered }

// --- Hashing ---

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// WebCrypto is only available in a secure context. Vite serves localhost, which
// counts — but opening the app over plain http on a LAN address would not.
function subtle(): SubtleCrypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      "This browser won't let Pitchwork hash a password on an insecure page. Open it on localhost or over https.",
    )
  }
  return globalThis.crypto.subtle
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const material = await subtle().importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await subtle().deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    material,
    KEY_BITS,
  )
  return toBase64(new Uint8Array(bits))
}

// Compare every character even once they differ, so how long a wrong password takes
// says nothing about how much of it was right.
function sameHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// --- Validation ---

export const MIN_PASSWORD_LENGTH = 8

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function emailProblem(email: string): string | null {
  const value = normaliseEmail(email)
  if (!value) return 'Enter your email.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "That doesn't look like an email address."
  return null
}

export function passwordProblem(password: string): string | null {
  if (!password) return 'Enter a password.'
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  return null
}

// --- Signing in and out ---

// Everything the app has in memory belongs to the account that was open. Swap it.
function openAccount(account: Account | null, remember = false): void {
  setActiveAccount(account?.id ?? null)
  if (account) rememberSignedIn(account.id, remember)
  else clearSignedIn()

  reloadSessions()
  reloadSettings()
  reloadCustomWorkouts()
  reloadCustomExercises()
  reloadChallenges()
  currentStore.replace(account)
}

export class AuthError extends Error {}

export async function createAccount(
  email: string,
  password: string,
  remember: boolean,
): Promise<Account> {
  const address = normaliseEmail(email)
  if (accountsStore.get().some((a) => a.email === address)) {
    throw new AuthError('There is already an account with that email on this browser.')
  }

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const account: Account = {
    id: globalThis.crypto.randomUUID(),
    email: address,
    createdAt: new Date().toISOString(),
    salt: toBase64(salt),
    hash: await derive(password, salt, ITERATIONS),
    iterations: ITERATIONS,
  }

  // The very first account inherits whatever was already here, so adding a sign-in
  // screen never looks like losing your history.
  if (accountsStore.get().length === 0) claimLegacyData(account.id)

  accountsStore.set([...accountsStore.get(), account])
  openAccount(account, remember)

  // A bare tally, so "how many people made an account" is answerable at all. The
  // account itself never leaves this browser — there is nothing to send and no
  // server to send it to. See lib/analytics.ts.
  countEvent('account-created')
  return account
}

export async function signIn(email: string, password: string, remember: boolean): Promise<Account> {
  const address = normaliseEmail(email)
  const account = accountsStore.get().find((a) => a.email === address)

  // Hash even when there's no such account, so a wrong email and a wrong password
  // take the same time and feel the same.
  const salt = account ? fromBase64(account.salt) : new Uint8Array(SALT_BYTES)
  const attempt = await derive(password, salt, account?.iterations ?? ITERATIONS)

  if (!account || !sameHash(attempt, account.hash)) {
    throw new AuthError("That email and password don't match an account on this browser.")
  }

  openAccount(account, remember)
  return account
}

export function signOut(): void {
  openAccount(null)
}

export async function changePassword(current: string, next: string): Promise<void> {
  const account = currentStore.get()
  if (!account) throw new AuthError('You are not signed in.')

  const attempt = await derive(current, fromBase64(account.salt), account.iterations)
  if (!sameHash(attempt, account.hash)) throw new AuthError('That current password is wrong.')

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const updated: Account = {
    ...account,
    salt: toBase64(salt),
    hash: await derive(next, salt, ITERATIONS),
    iterations: ITERATIONS,
  }
  accountsStore.set(accountsStore.get().map((a) => (a.id === account.id ? updated : a)))
  currentStore.replace(updated)
}

// Removes the account and everything filed under it. There is no undo and no copy
// anywhere else, which is why the UI asks twice.
export function deleteAccount(): void {
  const account = currentStore.get()
  if (!account) return
  dropAccountData(account.id)
  accountsStore.set(accountsStore.get().filter((a) => a.id !== account.id))
  openAccount(null)
}

/*
  Adopting an account record that was exported on another device.

  The record is taken as it is — same id, same salt, same hash — which is the whole
  point: the password you already know keeps working, and it still isn't stored
  anywhere, here or there. Credentials stay this file's business, so transfer.ts
  moves the *data* and asks this to place the account.

  An account with that email already on this browser is left completely alone. Its
  password wins; only its training gets merged. Overwriting it would let anyone with
  a transfer file change the password on an account they can already see.
*/
export function adoptAccount(incoming: Account): { accountId: string; created: boolean } {
  const existing = accountsStore.get().find((a) => a.email === normaliseEmail(incoming.email))
  if (existing) return { accountId: existing.id, created: false }

  const account: Account = { ...incoming, email: normaliseEmail(incoming.email) }
  accountsStore.set([...accountsStore.get(), account])
  return { accountId: account.id, created: true }
}

// True when there's data from before accounts existed, waiting to be claimed.
export function hasUnclaimedData(): boolean {
  return accountsStore.get().length === 0 && hasLegacyData()
}
