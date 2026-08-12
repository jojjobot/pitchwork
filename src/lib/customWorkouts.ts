import { useMemo } from 'react'
import { workouts } from '../data/workouts'
import { loadCustomWorkouts, saveCustomWorkouts } from './storage'
import { createStore, reloadFrom, useStore } from './store'
import { deriveFiling } from './builder'
import { estimateWorkout } from './workout'
import type { Workout, WorkoutBlock } from '../types'

/*
  The sessions you built, and the one list every screen should ask about.

  The programme is fixed at build time; your own sessions are not, so they can't
  simply be imported. Instead they live here in one place that React subscribes to:
  edit a session on the builder screen and the browse list, the detail page and the
  player all see the change immediately, because they are all reading this.
*/

const store = createStore(loadCustomWorkouts(), saveCustomWorkouts)
const customs = () => store.get()
const commit = (next: Workout[]) => store.set(next)

export function useCustomWorkouts(): Workout[] {
  return useStore(store)
}

export function useAllWorkouts(): Workout[] {
  const mine = useStore(store)
  // Rebuilt only when your sessions actually change, so the identity stays stable
  // for the filtering and measuring that hangs off it.
  return useMemo(() => [...workouts, ...mine], [mine])
}

// The programme and your own sessions look the same to every screen — the player
// doesn't care where a session came from.
export function useWorkout(id: string | undefined): Workout | undefined {
  const list = useAllWorkouts()
  return id ? list.find((w) => w.id === id) : undefined
}

// --- Writing ---

/*
  Three fields on a custom session are never typed in — they're read back off the
  blocks on every single write, so they cannot drift from what the session holds:
  which skill it's filed under, how hard it is, and how long it takes.
*/
function refile(workout: Workout): Workout {
  return {
    ...workout,
    ...deriveFiling(workout.blocks),
    estimatedMinutes: estimateWorkout(workout).minutes,
  }
}

// C1, C2, C3… — short like the programme's own codes, and never a duplicate.
function nextCode(): string {
  const used = new Set(customs().map((w) => w.code))
  let n = 1
  while (used.has(`C${n}`)) n++
  return `C${n}`
}

function newId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function createCustomWorkout(seed: Partial<Workout> = {}): Workout {
  const workout = refile({
    name: 'Untitled session',
    goal: '',
    description: '',
    category: 'athleticism',
    difficulty: 'beginner',
    blocks: [],
    ...seed,
    // A custom session writes its own identity — a copy can never inherit one.
    id: newId(),
    code: nextCode(),
    focus: '', // the category bars say this better than a sentence could
    estimatedMinutes: 0,
    isCustom: true,
  })
  commit([...customs(), workout])
  return workout
}

// Start from a session that already works. Blocks are copied, not shared, so
// editing your version can never touch the original.
export function duplicateWorkout(source: Workout): Workout {
  return createCustomWorkout({
    name: `${source.name} (my version)`,
    goal: source.goal,
    description: source.description,
    blocks: source.blocks.map((b) => ({ ...b })),
  })
}

export function updateCustomWorkout(id: string, patch: Partial<Workout>): void {
  commit(customs().map((w) => (w.id === id ? refile({ ...w, ...patch, id: w.id, isCustom: true }) : w)))
}

export function updateBlocks(id: string, change: (blocks: WorkoutBlock[]) => WorkoutBlock[]): void {
  const current = customs().find((w) => w.id === id)
  if (!current) return
  updateCustomWorkout(id, { blocks: change(current.blocks) })
}

export function deleteCustomWorkout(id: string): void {
  commit(customs().filter((w) => w.id !== id))
}

// Called by lib/auth.ts when the signed-in account changes.
export function reload(): void {
  reloadFrom(store, loadCustomWorkouts)
}
