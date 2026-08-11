/*
  The shape of all data in Pitchwork. If you edit content in src/data/, these
  types describe what each field means. TypeScript uses them to catch typos
  (e.g. a category that doesn't exist) before the app even runs.
*/

export type Category =
  | 'dribbling'
  | 'passing'
  | 'shooting'
  | 'first-touch'
  | 'defending'
  | 'athleticism'
  | 'strength'
  | 'recovery'

export type Equipment = 'ball' | 'cones' | 'wall' | 'goal' | 'partner' | 'none'
export type Space = 'small' | 'medium' | 'full-pitch'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type MeasureType = 'time' | 'reps' | 'distance'

export interface Exercise {
  id: string
  name: string
  category: Category
  rank?: number // effectiveness rank within its category (1 = highest return); optional
  shortDescription: string // one line, shown in lists
  instructions: string[] // numbered steps, shown during a session
  coachingCues: string[] // short "do this well" tips
  equipment: Equipment[]
  spaceNeeded: Space // small = a garage/backyard
  difficulty: Difficulty
  measureType: MeasureType
  defaultDuration: number // seconds (used for time drills, and to estimate rep drills)
  defaultReps: number | null
  defaultSets: number
  restBetweenSets: number // seconds
  skillTags: string[]
}

export interface WorkoutBlock {
  exerciseId: string
  duration: number | null // overrides the exercise default (null = use default)
  reps: number | null
  sets: number
  restAfter: number // seconds of rest after this block, before the next
  note: string | null // an optional coaching note for this block
}

export interface Workout {
  id: string
  name: string
  description: string
  goal: string // e.g. "Sharper first touch"
  estimatedMinutes: number
  difficulty: Difficulty
  isCustom: boolean // true = created by the user
  blocks: WorkoutBlock[]
}

export interface CompletedSession {
  id: string
  workoutId: string
  workoutName: string // snapshot, so history survives a deleted workout
  completedAt: string // ISO date string
  totalMinutes: number
  exercisesCompleted: number
  exercisesSkipped: number
  categoryBreakdown: Partial<Record<Category, number>> // minutes per category
  perceivedEffort: 1 | 2 | 3 | 4 | 5 | null
  notes: string | null
}

// Multi-week plans — data only for now, wired into the UI in a later phase.
export interface PlanWeek {
  week: number
  workoutIds: string[]
}
export interface Plan {
  id: string
  name: string
  description: string
  weeks: PlanWeek[]
}
