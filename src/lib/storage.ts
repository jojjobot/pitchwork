import type { CompletedSession } from '../types'

/*
  Everything we keep on the device lives in localStorage under these keys.
  No account, no server — clearing your browser data clears your history.
*/
const SESSIONS_KEY = 'pitchwork.sessions.v1'
const SETTINGS_KEY = 'pitchwork.settings.v1'

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
