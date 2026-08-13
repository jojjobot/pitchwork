import type { CompletedSession, Workout } from '../types'
import {
  DEFAULT_SETTINGS,
  readAccountBucket,
  writeAccountBucket,
  type Settings,
} from './storage'
import { adoptAccount, getAccount, type Account } from './auth'
import { getSessions } from './sessions'
import { getCustomWorkouts } from './customWorkouts'
import { getSettings } from './settings'

/*
  MOVING AN ACCOUNT TO ANOTHER DEVICE.

  Pitchwork has no server, so an account exists only in the browser that made it.
  Signing in on a phone can't find a laptop's account because there is nothing on
  the phone to find. This file is the manual bridge: a file you carry across.

  It is a copy, not a sync. Train on both devices afterwards and they drift apart —
  though because everything merges by id and nothing is ever overwritten, carrying
  the file back later folds the two histories together instead of picking a winner.

  The file contains the account's password hash and salt, so the password you
  already know still works on the new device. That also means the file is worth
  guarding: it holds all your training, and someone who takes it could grind
  guesses against the hash offline. The UI says so where you export it.
*/

const FORMAT = 'pitchwork.transfer'
const VERSION = 1

export interface TransferFile {
  format: typeof FORMAT
  version: number
  exportedAt: string
  account: Account
  sessions: CompletedSession[]
  customWorkouts: Workout[]
  settings: Settings
}

export class TransferError extends Error {}

export function buildTransfer(): TransferFile {
  const account = getAccount()
  if (!account) throw new TransferError('You need to be signed in to move an account.')

  return {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    account,
    sessions: getSessions(),
    customWorkouts: getCustomWorkouts(),
    settings: getSettings(),
  }
}

export function transferFilename(email: string): string {
  const who = email.split('@')[0]?.replace(/[^a-z0-9]+/gi, '-') ?? 'account'
  return `pitchwork-${who}-${new Date().toISOString().slice(0, 10)}.json`
}

// A transfer file is worthless without a usable account record, so this is strict
// about the account and forgiving about everything else: a corrupted history is
// worth importing partially, a corrupted identity is not worth importing at all.
function validAccount(value: unknown): Account | null {
  if (!value || typeof value !== 'object') return null
  const a = value as Record<string, unknown>
  const strings = ['id', 'email', 'createdAt', 'salt', 'hash']
  if (!strings.every((key) => typeof a[key] === 'string' && (a[key] as string).length > 0)) {
    return null
  }
  if (typeof a.iterations !== 'number' || !Number.isFinite(a.iterations) || a.iterations < 1) {
    return null
  }
  return a as unknown as Account
}

function list<T extends { id?: unknown }>(value: unknown): T[] {
  return Array.isArray(value) ? (value.filter((item) => item && typeof item === 'object') as T[]) : []
}

// Merge by id, keeping what's already here. Nothing imported can overwrite or
// delete a session you did on this device — the worst case is nothing new arrives.
function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): { merged: T[]; added: number } {
  const byId = new Map(existing.map((item) => [item.id, item]))
  let added = 0
  for (const item of incoming) {
    if (typeof item?.id === 'string' && !byId.has(item.id)) {
      byId.set(item.id, item)
      added++
    }
  }
  return { merged: [...byId.values()], added }
}

export interface TransferResult {
  email: string
  created: boolean
  sessionsAdded: number
  workoutsAdded: number
}

/*
  Applies a transfer file. Runs on the sign-in screen, signed out, so it writes to
  the account's drawer by id rather than through the usual "whoever is open" path.

  It deliberately does NOT sign anyone in: the password isn't in the file in any
  usable form, which is exactly as it should be. You sign in afterwards, normally.
*/
export function applyTransfer(raw: unknown): TransferResult {
  if (!raw || typeof raw !== 'object') throw new TransferError("That file isn't a Pitchwork transfer.")
  const file = raw as Partial<TransferFile>

  if (file.format !== FORMAT) {
    throw new TransferError(
      "That file isn't a Pitchwork transfer. Use the file from 'Move to another device', not a history backup.",
    )
  }
  if (typeof file.version !== 'number' || file.version > VERSION) {
    throw new TransferError('That file was made by a newer version of Pitchwork.')
  }

  const account = validAccount(file.account)
  if (!account) throw new TransferError('That transfer file has no account in it.')

  const { accountId, created } = adoptAccount(account)

  const sessions = mergeById(
    readAccountBucket<CompletedSession[]>(accountId, 'sessions', []),
    list<CompletedSession>(file.sessions),
  )
  sessions.merged.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  writeAccountBucket(accountId, 'sessions', sessions.merged)

  const workouts = mergeById(
    readAccountBucket<Workout[]>(accountId, 'customWorkouts', []),
    list<Workout>(file.customWorkouts),
  )
  writeAccountBucket(accountId, 'customWorkouts', workouts.merged)

  // Preferences only ride along to a device that didn't have this account. On one
  // that did, the settings you chose *there* are the ones you meant.
  if (created && file.settings && typeof file.settings === 'object') {
    writeAccountBucket(accountId, 'settings', { ...DEFAULT_SETTINGS, ...file.settings })
  }

  return {
    email: account.email,
    created,
    sessionsAdded: sessions.added,
    workoutsAdded: workouts.added,
  }
}
