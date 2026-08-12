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
  duration: number | null // seconds per set for TIMED drills (null = use the drill's default)
  reps: number | null // reps per set for REP drills (null = use the drill's default)
  sets: number
  restBetweenSets: number | null // seconds between sets (null = use the drill's default)
  // How long one set of a REP drill is expected to take. Rep drills are self-paced in
  // the player — this number exists only so the session length we advertise is honest.
  // null = estimate it from the drill's default pace.
  estimateSeconds: number | null
  restAfter: number // seconds of rest after this block, before the next
  note: string | null // an optional coaching note for this block
}

export interface Workout {
  id: string
  code: string // the short label from the programme, e.g. "A1", "D7"
  name: string
  category: Category // the skill this session is built around (how it's filed)
  description: string
  goal: string // e.g. "Sharper first touch"
  focus: string // what the minutes are spent on, e.g. "5 min mechanics · 7 min acceleration"
  estimatedMinutes: number // the length as written; the app displays the computed length
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
