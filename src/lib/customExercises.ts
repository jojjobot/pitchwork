import { useMemo } from 'react'
import { exercises, exerciseById } from '../data/exercises'
import { loadCustomExercises, saveCustomExercises } from './storage'
import { createStore, reloadFrom, useStore } from './store'
import type { Category, Difficulty, Equipment, Exercise, MeasureType, Space } from '../types'
import { registerReloader } from './reload'

/*
  The drills you wrote yourself.

  Exactly the same idea as lib/customWorkouts.ts, one level down: the library in
  src/data/exercises.ts is fixed at build time, yours are not, so they live here in
  one store every screen subscribes to.

  The important part is that nothing downstream can tell the difference. A drill you
  wrote goes into a session, gets counted in the session length, shows its steps in
  the player and files itself under a category, all through the same code paths the
  built-in ones use — because after `findExercise` resolves an id, there is no
  difference left to act on.
*/

const store = createStore(loadCustomExercises(), saveCustomExercises)
const mine = () => store.get()

export function useCustomExercises(): Exercise[] {
  return useStore(store)
}

// The same list outside React, for lib/transfer.ts.
export function getCustomExercises(): Exercise[] {
  return store.get()
}

export function useAllExercises(): Exercise[] {
  const custom = useStore(store)
  // Yours first: a library of 172 built-ins would otherwise bury the six you wrote.
  return useMemo(() => [...custom, ...exercises], [custom])
}

export function useExercise(id: string | undefined): Exercise | undefined {
  const all = useAllExercises()
  return id ? all.find((ex) => ex.id === id) : undefined
}

/*
  A lookup function for screens that resolve many ids at once — a session's block
  list, say. Hooks can't be called inside a map, so those screens take this once and
  call it per row, and still re-render when a drill they're showing is edited.
*/
export function useExerciseLookup(): (id: string) => Exercise | undefined {
  const custom = useStore(store)
  return useMemo(() => {
    const byId = new Map(custom.map((ex) => [ex.id, ex]))
    return (id: string) => exerciseById[id] ?? byId.get(id)
  }, [custom])
}

/*
  Resolving a drill id outside React — used by the session builder and the length
  estimator, which run while measuring rather than while rendering.

  Built-ins are checked first and by map, because that is the overwhelmingly common
  case and it stays O(1) no matter how many drills you write.
*/
export function findExercise(id: string): Exercise | undefined {
  return exerciseById[id] ?? mine().find((ex) => ex.id === id)
}

// --- Writing ---

function newId(): string {
  return `mine-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/*
  A blank drill, with defaults that make it usable the second it exists: you can add
  it to a session before writing a single instruction. Everything here is editable.
*/
export function blankExercise(): Exercise {
  return {
    id: newId(),
    name: 'Untitled drill',
    category: 'dribbling',
    alsoTrains: [],
    shortDescription: '',
    instructions: [],
    coachingCues: [],
    equipment: ['none'],
    spaceNeeded: 'small',
    difficulty: 'beginner',
    measureType: 'time',
    defaultDuration: 45,
    defaultReps: null,
    defaultSets: 3,
    restBetweenSets: 30,
    skillTags: [],
    isCustom: true,
  }
}

export function createCustomExercise(seed: Partial<Exercise> = {}): Exercise {
  const exercise: Exercise = {
    ...blankExercise(),
    ...seed,
    // A drill writes its own identity — a copy can never inherit one, and no custom
    // drill may ever claim a built-in id and shadow it in findExercise().
    id: newId(),
    isCustom: true,
  }
  store.set([...mine(), exercise])
  return exercise
}

// Start from a built-in that nearly works. Arrays are copied, not shared, so editing
// your version can't reach back into the library.
export function duplicateExercise(source: Exercise): Exercise {
  return createCustomExercise({
    ...source,
    name: `${source.name} (my version)`,
    instructions: [...source.instructions],
    coachingCues: [...source.coachingCues],
    equipment: [...source.equipment],
    skillTags: [...source.skillTags],
    alsoTrains: source.alsoTrains ? [...source.alsoTrains] : undefined,
    // The score is the library's own read on the built-in drill. Your version is
    // about to change, so it can't inherit a judgement of what it used to be.
    efficiency: undefined,
  })
}

export function updateCustomExercise(id: string, patch: Partial<Exercise>): void {
  store.set(mine().map((ex) => (ex.id === id ? { ...ex, ...patch, id: ex.id, isCustom: true } : ex)))
}

/*
  Deleting a drill you wrote.

  Sessions holding it are deliberately left alone. buildSteps() already skips a block
  whose drill is missing, so the session shortens rather than breaks — and if you
  delete one by mistake, the blocks are still sitting there waiting for it to come
  back. Quietly rewriting your sessions would be the more destructive choice.
*/
export function deleteCustomExercise(id: string): void {
  store.set(mine().filter((ex) => ex.id !== id))
}

// Called by lib/auth.ts when the signed-in account changes.
export function reload(): void {
  reloadFrom(store, loadCustomExercises)
}

// Signing in or out and a cloud sync both swap this store's contents; see lib/reload.ts.
registerReloader(reload)

// --- What a drill needs before it's worth saving ---

/*
  Deliberately thin. A drill with no instructions is still a drill you can do — you
  know what you meant — so this only catches the things that would leave a blank
  space in a list you're trying to read later.
*/
export function exerciseProblem(ex: Exercise): string | null {
  if (!ex.name.trim()) return 'Give the drill a name.'
  if (ex.measureType === 'reps' && (ex.defaultReps == null || ex.defaultReps < 1)) {
    return 'A rep drill needs at least one rep.'
  }
  if (ex.measureType !== 'reps' && ex.defaultDuration < 5) {
    return 'A timed drill needs at least five seconds.'
  }
  return null
}

// The options the drill form offers, in the order it offers them.
export const CATEGORY_CHOICES: Category[] = [
  'dribbling',
  'passing',
  'first-touch',
  'shooting',
  'defending',
  'athleticism',
  'strength',
  'recovery',
]
export const DIFFICULTY_CHOICES: Difficulty[] = ['beginner', 'intermediate', 'advanced']
export const SPACE_CHOICES: Space[] = ['small', 'medium', 'full-pitch']
export const MEASURE_CHOICES: MeasureType[] = ['time', 'reps']
export const EQUIPMENT_CHOICES: Equipment[] = [
  'ball',
  'cones',
  'wall',
  'goal',
  'partner',
  'weights',
  'bar',
]
