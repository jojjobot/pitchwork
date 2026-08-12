import type { CompletedSession, Workout } from '../types'

/*
  Everything we keep on the device lives in localStorage under these keys.
  No account, no server — clearing your browser data clears your history.
*/
const SESSIONS_KEY = 'pitchwork.sessions.v1'
const SETTINGS_KEY = 'pitchwork.settings.v1'
const CUSTOM_WORKOUTS_KEY = 'pitchwork.customWorkouts.v1'

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

// --- Completed sessions (training history) ---

export function loadSessions(): CompletedSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    return raw ? (JSON.parse(raw) as CompletedSession[]) : []
  } catch {
    return []
  }
}

export function saveSession(session: CompletedSession): void {
  const all = loadSessions()
  all.unshift(session) // newest first
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(all))
  } catch {
    // storage full or unavailable — nothing more we can do here
  }
}

// --- Workouts you built yourself ---
// The programme in src/data/workouts.ts is read-only; anything you make is kept
// here. Reading and writing the whole list at once is fine — there will never be
// enough custom sessions for that to matter.

export function loadCustomWorkouts(): Workout[] {
  try {
    const raw = localStorage.getItem(CUSTOM_WORKOUTS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as Workout[]) : []
  } catch {
    return []
  }
}

export function saveCustomWorkouts(list: Workout[]): void {
  try {
    localStorage.setItem(CUSTOM_WORKOUTS_KEY, JSON.stringify(list))
  } catch {
    // storage full or unavailable — nothing more we can do here
  }
}

// --- Settings ---

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}
