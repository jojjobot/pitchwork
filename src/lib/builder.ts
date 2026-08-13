import { exerciseById } from '../data/exercises'
import { estimateWorkout } from './workout'
import { formatSeconds } from './format'
import type { Category, Difficulty, Exercise, WorkoutBlock } from '../types'

/*
  The rules the workout builder plays by. All pure functions — they take blocks and
  give back blocks, so the screens stay about tapping and the decisions live here.
*/

// A breather between drills. The programme uses 30–60s; this sits in the middle.
export const DEFAULT_REST_AFTER = 45

// A drill dropped into a session, prescribed exactly as the drill itself suggests.
// Every field that CAN say "use the drill's default" does, so a fresh block stays
// tied to the library: sharpen the drill's defaults later and this block follows.
// You only pin a number down by changing it in the block editor.
export function newBlockFor(ex: Exercise): WorkoutBlock {
  return {
    exerciseId: ex.id,
    duration: null,
    reps: null,
    sets: Math.max(1, ex.defaultSets),
    restBetweenSets: null,
    estimateSeconds: null,
    restAfter: DEFAULT_REST_AFTER,
    note: null,
    weightKg: null,
  }
}

// The kilos this block is done with: your own number if you set one, otherwise the
// drill's suggestion. null means the drill isn't loaded and never asks about weight.
export function blockWeightKg(ex: Exercise, block: WorkoutBlock): number | null {
  if (!ex.usesWeight) return null
  return block.weightKg ?? ex.defaultWeightKg ?? null
}

// Kilos as they're written everywhere: no trailing ".0" on whole numbers, because
// half-kilo steps exist but most weights land on whole ones.
export function formatKg(kg: number): string {
  return `${Number.isInteger(kg) ? kg : kg.toFixed(1)} kg`
}

export function moveBlock(blocks: WorkoutBlock[], index: number, delta: number): WorkoutBlock[] {
  const to = index + delta
  if (to < 0 || to >= blocks.length) return blocks
  const next = blocks.slice()
  const [moved] = next.splice(index, 1)
  next.splice(to, 0, moved)
  return next
}

export function replaceBlock(blocks: WorkoutBlock[], index: number, block: WorkoutBlock): WorkoutBlock[] {
  return blocks.map((b, i) => (i === index ? block : b))
}

export function removeBlock(blocks: WorkoutBlock[], index: number): WorkoutBlock[] {
  return blocks.filter((_, i) => i !== index)
}

/*
  How a session you built gets filed. Neither of these is a question worth asking
  you: a session is about whatever it spends the most time on, and it is as hard as
  the hardest drill in it. Both are recomputed on every edit, so they can never drift
  away from what the session actually contains.
*/
const DIFFICULTY_RANK: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
}
const RANKED_DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced']

export interface Filing {
  category: Category
  difficulty: Difficulty
}

export function deriveFiling(blocks: WorkoutBlock[]): Filing {
  const { categorySeconds } = estimateWorkout({ blocks })

  let category: Category = 'athleticism'
  let best = -1
  for (const [cat, secs] of Object.entries(categorySeconds) as [Category, number][]) {
    if (secs > best) {
      best = secs
      category = cat
    }
  }

  let hardest = 0
  for (const block of blocks) {
    const ex = exerciseById[block.exerciseId]
    if (ex) hardest = Math.max(hardest, DIFFICULTY_RANK[ex.difficulty])
  }

  return { category, difficulty: RANKED_DIFFICULTIES[hardest] }
}

// What one block costs: every set, plus the rests between them. The rest *after* the
// block belongs to the gap, not the drill, so it is deliberately left out.
export function blockSeconds(block: WorkoutBlock): number {
  return estimateWorkout({ blocks: [block] }).seconds
}

// The prescription as a short line, e.g. "3 × 45s", "4 × 12 reps" or "4 × 6 reps @ 60 kg".
export function blockPrescription(ex: Exercise, block: WorkoutBlock): string {
  const per =
    ex.measureType === 'reps'
      ? `${block.reps ?? ex.defaultReps} reps`
      : formatSeconds(block.duration ?? ex.defaultDuration)
  const kg = blockWeightKg(ex, block)
  return `${block.sets} × ${per}${kg != null ? ` @ ${formatKg(kg)}` : ''}`
}
