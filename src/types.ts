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

export type Equipment = 'ball' | 'cones' | 'wall' | 'goal' | 'partner' | 'weights' | 'bar' | 'none'
export type Space = 'small' | 'medium' | 'full-pitch'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type MeasureType = 'time' | 'reps' | 'distance'

export interface Exercise {
  id: string
  name: string
  // The skill this drill is filed under, and the only one its minutes are counted
  // towards. Deliberately one category: a session that spends 10 minutes on rondos
  // has spent 10 minutes, and splitting those minutes across every skill a rondo
  // touches would make the weekly totals add up to more training than you did.
  category: Category
  // The other skills it genuinely works, best first. This is for finding drills, not
  // for counting them — filtering the library by "Defending" surfaces the rondo,
  // because the two players in the middle are defending.
  alsoTrains?: Category[]
  // 1–100: how much one minute here moves your actual match performance. See the
  // rubric at the top of src/data/exercises.ts for how the number is arrived at.
  // Optional: drills you wrote yourself don't get one.
  efficiency?: number
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
  // Drills you load with a bar, dumbbell, kettlebell or med ball. Sets and reps alone
  // don't describe one of these — "4 × 6" of a bench press is meaningless without the
  // weight — so the builder asks for kilos too, and the player shows them.
  usesWeight?: boolean
  defaultWeightKg?: number | null // a starting suggestion, not a prescription
  isCustom?: boolean // true = you wrote it; the built-in library never sets this
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
  // Kilos on the bar for a LOADED drill (null = use the drill's suggestion). Optional
  // because sessions saved before weights existed simply don't have the field, and a
  // missing one has to keep meaning "whatever the drill says" rather than break them.
  weightKg?: number | null
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
