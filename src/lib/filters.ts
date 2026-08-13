import type { Category, Difficulty, Equipment, Space } from '../types'
import { createStore, useStore } from './store'

/*
  Where you'd got to in the library and the workouts list.

  Both screens used to keep their filters in component state, which meant opening a
  drill to read it threw the search, the skill chip and the kit away — you came back
  to the top of an unfiltered list and had to set it all up again. Browsing isn't a
  one-shot action, so the filters outlive the screen and are only cleared when you
  clear them.

  Deliberately memory-only, unlike the rest of the stores: a filter is where you are
  right now, not something you own. Closing the app is a fair moment to forget it.
*/

// The kit you can toggle on and off ("what have you got with you?").
export const KIT: Equipment[] = ['ball', 'cones', 'wall', 'goal', 'partner', 'weights', 'bar']

export type DurationBand = 'any' | 'short' | 'medium' | 'long'
// The skill chips on the workouts screen, plus two that aren't skills.
export type Filing = Category | 'all' | 'mine'

export interface LibraryFilters {
  search: string
  category: Category | 'all'
  space: Space | 'any'
  difficulty: Difficulty | 'any'
  available: Set<Equipment>
  panelOpen: boolean
}

export interface WorkoutFilters {
  search: string
  category: Filing
  difficulty: Difficulty | 'any'
  duration: DurationBand
  space: Space | 'any'
  available: Set<Equipment>
  panelOpen: boolean
}

const LIBRARY_DEFAULTS: LibraryFilters = {
  search: '',
  category: 'all',
  space: 'any',
  difficulty: 'any',
  available: new Set(KIT),
  panelOpen: false,
}

const WORKOUT_DEFAULTS: WorkoutFilters = {
  search: '',
  category: 'all',
  difficulty: 'any',
  duration: 'any',
  space: 'any',
  available: new Set(KIT),
  panelOpen: false,
}

const libraryStore = createStore<LibraryFilters>(LIBRARY_DEFAULTS)
const workoutStore = createStore<WorkoutFilters>(WORKOUT_DEFAULTS)

// Whether the panel is open is how the screen looks, not what it's showing, so it
// doesn't count as a filter and clearing doesn't close it under your hands.
function clearedTo<T extends { panelOpen: boolean }>(defaults: T, current: T): T {
  return { ...defaults, available: new Set(KIT), panelOpen: current.panelOpen } as T
}

export function useLibraryFilters() {
  const filters = useStore(libraryStore)
  return {
    filters,
    /** Change one or more fields; everything else stays as it was. */
    set: (patch: Partial<LibraryFilters>) => libraryStore.set({ ...libraryStore.get(), ...patch }),
    clear: () => libraryStore.set(clearedTo(LIBRARY_DEFAULTS, libraryStore.get())),
  }
}

export function useWorkoutFilters() {
  const filters = useStore(workoutStore)
  return {
    filters,
    set: (patch: Partial<WorkoutFilters>) => workoutStore.set({ ...workoutStore.get(), ...patch }),
    clear: () => workoutStore.set(clearedTo(WORKOUT_DEFAULTS, workoutStore.get())),
  }
}

// Toggling one piece of kit, without every caller rebuilding the set by hand.
export function toggledKit(available: Set<Equipment>, item: Equipment): Set<Equipment> {
  const next = new Set(available)
  next.has(item) ? next.delete(item) : next.add(item)
  return next
}
