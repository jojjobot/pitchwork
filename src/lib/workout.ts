import { exerciseById } from '../data/exercises'
import { SPACE_RANK } from './labels'
import type { Category, Equipment, Exercise, Space, Workout } from '../types'

/*
  Turning a workout (a list of blocks) into the exact sequence of steps the session
  player walks through, and working out how long it takes. Both the player and the
  workout cards use this so the numbers always agree.
*/

// A single thing the player shows: either a drill effort, or a rest period.
export type SessionStep =
  | {
      kind: 'work'
      blockIndex: number
      exercise: Exercise
      setIndex: number // 1-based
      setCount: number
      seconds: number | null // for timed drills; null for rep-based
      reps: number | null // for rep-based drills
      note: string | null
    }
  | {
      kind: 'rest'
      seconds: number
      nextExercise: Exercise | null
      nextSetIndex: number | null
      nextSetCount: number | null
      reason: 'set' | 'block' // rest between sets, or rest before the next drill
    }

export function buildSteps(workout: Workout): SessionStep[] {
  const steps: SessionStep[] = []

  workout.blocks.forEach((block, bi) => {
    const ex = exerciseById[block.exerciseId]
    if (!ex) return // skip a block whose drill was deleted

    const isTimed = ex.measureType !== 'reps'
    const seconds = isTimed ? block.duration ?? ex.defaultDuration : null
    const reps = !isTimed ? block.reps ?? ex.defaultReps : null
    const setCount = Math.max(1, block.sets)

    for (let s = 1; s <= setCount; s++) {
      steps.push({
        kind: 'work',
        blockIndex: bi,
        exercise: ex,
        setIndex: s,
        setCount,
        seconds,
        reps,
        note: block.note,
      })
      // rest between sets
      if (s < setCount && ex.restBetweenSets > 0) {
        steps.push({
          kind: 'rest',
          seconds: ex.restBetweenSets,
          nextExercise: ex,
          nextSetIndex: s + 1,
          nextSetCount: setCount,
          reason: 'set',
        })
      }
    }

    // rest after the block, before the next drill
    const isLast = bi === workout.blocks.length - 1
    if (!isLast && block.restAfter > 0) {
      const nextBlock = workout.blocks[bi + 1]
      const nextEx = exerciseById[nextBlock.exerciseId] ?? null
      steps.push({
        kind: 'rest',
        seconds: block.restAfter,
        nextExercise: nextEx,
        nextSetIndex: 1,
        nextSetCount: nextEx ? nextBlock.sets : null,
        reason: 'block',
      })
    }
  })

  return steps
}

export interface WorkoutEstimate {
  seconds: number
  minutes: number
  categorySeconds: Partial<Record<Category, number>>
}

// Honest length + how the work time splits across skill categories.
export function estimateWorkout(workout: Workout): WorkoutEstimate {
  const steps = buildSteps(workout)
  let seconds = 0
  const categorySeconds: Partial<Record<Category, number>> = {}

  for (const step of steps) {
    if (step.kind === 'rest') {
      seconds += step.seconds
    } else {
      // rep-based drills have no fixed time, so estimate with the drill's default
      const work = step.seconds ?? step.exercise.defaultDuration
      seconds += work
      categorySeconds[step.exercise.category] = (categorySeconds[step.exercise.category] ?? 0) + work
    }
  }

  return { seconds, minutes: Math.max(1, Math.round(seconds / 60)), categorySeconds }
}

export interface WorkoutMeta extends WorkoutEstimate {
  categories: Set<Category>
  equipment: Set<Equipment>
  space: Space
}

// Everything the browse/filter screen needs about a workout.
export function workoutMeta(workout: Workout): WorkoutMeta {
  const categories = new Set<Category>()
  const equipment = new Set<Equipment>()
  let space: Space = 'small'

  for (const block of workout.blocks) {
    const ex = exerciseById[block.exerciseId]
    if (!ex) continue
    categories.add(ex.category)
    ex.equipment.forEach((e) => {
      if (e !== 'none') equipment.add(e)
    })
    if (SPACE_RANK[ex.spaceNeeded] > SPACE_RANK[space]) space = ex.spaceNeeded
  }

  return { ...estimateWorkout(workout), categories, equipment, space }
}

// Category minutes sorted biggest-first, for a quick breakdown display.
export function categoryMinutesSorted(categorySeconds: Partial<Record<Category, number>>) {
  return (Object.entries(categorySeconds) as [Category, number][])
    .map(([category, secs]) => ({ category, minutes: Math.max(1, Math.round(secs / 60)) }))
    .sort((a, b) => b.minutes - a.minutes)
}
