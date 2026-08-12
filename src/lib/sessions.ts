import { createStore, reloadFrom, useStore } from './store'
import { loadSessions, saveSessions } from './storage'
import type { CompletedSession } from '../types'

/*
  Your training history — every session you finished and saved. Kept newest-first,
  which is the order every screen wants to show it in.
*/

const store = createStore(loadSessions(), saveSessions)

export function useSessions(): CompletedSession[] {
  return useStore(store)
}

export function useSession(id: string | undefined): CompletedSession | undefined {
  const sessions = useSessions()
  return id ? sessions.find((s) => s.id === id) : undefined
}

export function recordSession(session: CompletedSession): void {
  store.set([session, ...store.get()])
}

export function deleteSession(id: string): void {
  store.set(store.get().filter((s) => s.id !== id))
}

export function clearSessions(): void {
  store.set([])
}

export function getSessions(): CompletedSession[] {
  return store.get()
}

// Used by the restore-from-backup path in Settings.
export function replaceSessions(sessions: CompletedSession[]): void {
  store.set(sessions)
}

// Called by lib/auth.ts when the signed-in account changes.
export function reload(): void {
  reloadFrom(store, loadSessions)
}
