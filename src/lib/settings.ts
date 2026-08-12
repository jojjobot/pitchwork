import { createStore, useStore } from './store'
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './storage'
import type { Settings } from './storage'

/*
  Your preferences. The player reads these mid-session (it mutes and unmutes itself
  through here), and the settings screen writes them, so they have to be the same
  live value rather than two copies loaded at different times.
*/

const store = createStore(loadSettings(), saveSettings)

export function useSettings(): Settings {
  return useStore(store)
}

export function getSettings(): Settings {
  return store.get()
}

export function updateSettings(patch: Partial<Settings>): void {
  store.set({ ...store.get(), ...patch })
}

export function resetSettings(): void {
  store.set(DEFAULT_SETTINGS)
}
