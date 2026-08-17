import { CATEGORY_LABELS } from './labels'
import type { Category, CompletedSession, Workout } from '../types'

/*
  Reading your training history back to you: what you've done, what you've been
  avoiding, and what to do next. Pure functions over the saved sessions — nothing
  here is stored, so it can never go stale the way a cached "total minutes" would.

  Everything works in LOCAL time. A session finished at 11pm belongs to that day as
  you lived it, not to tomorrow in UTC.
*/

const DAY_MS = 86400000

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// Weeks run Monday–Sunday: a training week that splits at Sunday night matches how
// people actually talk about "this week".
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const weekday = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - weekday)
  return d
}

// Whole days from a to b, both taken as calendar days rather than instants — so a
// challenge that started on Monday is on day 3 all through Wednesday. Rounded
// because a clock change makes one of these days 23 or 25 hours long.
export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS)
}

// The skills a session can actually train. Recovery is real work but nobody is
// "neglecting" it, so it never drives a suggestion.
const TRAINABLE: Category[] = [
  'dribbling',
  'passing',
  'first-touch',
  'shooting',
  'defending',
  'athleticism',
  'strength',
]

export interface ProgressSummary {
  totalSessions: number
  totalMinutes: number
  thisWeekMinutes: number
  lastWeekMinutes: number
  streakDays: number
  categoryMinutes: Partial<Record<Category, number>>
  /** Days since each skill was last trained. Absent = never trained. */
  daysSince: Partial<Record<Category, number>>
  lastSession: CompletedSession | undefined
}

export function summarize(sessions: CompletedSession[], now = new Date()): ProgressSummary {
  const thisWeek = startOfWeek(now).getTime()
  const lastWeek = thisWeek - 7 * DAY_MS

  let totalMinutes = 0
  let thisWeekMinutes = 0
  let lastWeekMinutes = 0
  const categoryMinutes: Partial<Record<Category, number>> = {}
  const lastTrained: Partial<Record<Category, number>> = {}

  for (const s of sessions) {
    const at = new Date(s.completedAt).getTime()
    totalMinutes += s.totalMinutes
    if (at >= thisWeek) thisWeekMinutes += s.totalMinutes
    else if (at >= lastWeek) lastWeekMinutes += s.totalMinutes

    for (const [cat, mins] of Object.entries(s.categoryBreakdown) as [Category, number][]) {
      categoryMinutes[cat] = (categoryMinutes[cat] ?? 0) + mins
      if (at > (lastTrained[cat] ?? 0)) lastTrained[cat] = at
    }
  }

  const daysSince: Partial<Record<Category, number>> = {}
  for (const [cat, at] of Object.entries(lastTrained) as [Category, number][]) {
    daysSince[cat] = Math.max(0, daysBetween(new Date(at), now))
  }

  return {
    totalSessions: sessions.length,
    totalMinutes,
    thisWeekMinutes,
    lastWeekMinutes,
    streakDays: streak(sessions, now),
    categoryMinutes,
    daysSince,
    // Sessions are stored newest-first, so the head is the most recent.
    lastSession: sessions[0],
  }
}

/*
  Consecutive days you trained, counting back from today. Missing *today* doesn't
  break it — the day isn't over yet — so the streak only dies once a whole day has
  passed with nothing in it. That's the difference between a streak that motivates
  and one that punishes you at breakfast.
*/
export function streak(sessions: CompletedSession[], now = new Date()): number {
  if (sessions.length === 0) return 0

  const days = new Set(sessions.map((s) => startOfDay(new Date(s.completedAt)).getTime()))
  const today = startOfDay(now).getTime()

  // Start at today if it counts, otherwise yesterday; if neither, the streak is over.
  let cursor = days.has(today) ? today : today - DAY_MS
  if (!days.has(cursor)) return 0

  let count = 0
  while (days.has(cursor)) {
    count++
    cursor -= DAY_MS
  }
  return count
}

export interface Week {
  start: Date
  minutes: number
  sessions: number
  isCurrent: boolean
}

// The last `count` weeks, oldest first, including empty ones — a gap in training is
// information, so the chart must show it rather than close it up.
export function weeklyMinutes(sessions: CompletedSession[], count = 12, now = new Date()): Week[] {
  const currentStart = startOfWeek(now).getTime()
  const weeks: Week[] = []

  for (let i = count - 1; i >= 0; i--) {
    const start = currentStart - i * 7 * DAY_MS
    weeks.push({ start: new Date(start), minutes: 0, sessions: 0, isCurrent: i === 0 })
  }

  for (const s of sessions) {
    const weekStart = startOfWeek(new Date(s.completedAt)).getTime()
    const index = Math.round((weekStart - (currentStart - (count - 1) * 7 * DAY_MS)) / (7 * DAY_MS))
    if (index >= 0 && index < weeks.length) {
      weeks[index].minutes += s.totalMinutes
      weeks[index].sessions += 1
    }
  }

  return weeks
}

export interface Suggestion {
  workout: Workout
  reason: string
}

/*
  What to train next. The rule is simple and honest: whatever you've left alone
  longest. A never-trained skill outranks a stale one, and the reason always quotes
  the actual number so you can disagree with it.
*/
export function suggestSession(
  sessions: CompletedSession[],
  workouts: Workout[],
  now = new Date(),
): Suggestion | undefined {
  if (workouts.length === 0) return undefined

  const { daysSince } = summarize(sessions, now)
  // Don't suggest something they've just done.
  const recentIds = new Set(sessions.slice(0, 3).map((s) => s.workoutId))
  const pick = (pool: Workout[]) => pool.find((w) => !recentIds.has(w.id)) ?? pool[0]

  if (sessions.length === 0) {
    const starter = workouts.filter((w) => w.difficulty === 'beginner' && w.blocks.length > 0)
    const workout = pick(starter.length > 0 ? starter : workouts)
    return { workout, reason: 'A short beginner session — a good place to start.' }
  }

  // Never trained beats trained-a-while-ago; otherwise, the stalest skill wins.
  const ranked = TRAINABLE.map((category) => ({ category, days: daysSince[category] })).sort(
    (a, b) => {
      if (a.days == null && b.days == null) return 0
      if (a.days == null) return -1
      if (b.days == null) return 1
      return b.days - a.days
    },
  )

  for (const { category, days } of ranked) {
    const pool = workouts.filter((w) => w.category === category && w.blocks.length > 0)
    if (pool.length === 0) continue
    const workout = pick(pool)
    const skill = CATEGORY_LABELS[category].toLowerCase()
    return {
      workout,
      reason:
        days == null
          ? `You haven't trained ${skill} yet.`
          : days === 0
            ? `More ${skill} — you were on it today.`
            : `It's been ${days} ${days === 1 ? 'day' : 'days'} since you trained ${skill}.`,
    }
  }

  return { workout: pick(workouts), reason: 'Ready when you are.' }
}

// "Today", "Yesterday", "Tue 5 Aug" — how a person would say the date out loud.
export function relativeDay(iso: string, now = new Date()): string {
  const date = new Date(iso)
  const diff = daysBetween(date, now)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatWeekLabel(start: Date): string {
  return start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
