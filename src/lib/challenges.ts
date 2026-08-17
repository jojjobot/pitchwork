import { useMemo } from 'react'
import { challengeById } from '../data/challenges'
import { workoutById } from '../data/workouts'
import { createStore, reloadFrom, useStore } from './store'
import { loadChallenges, saveChallenges } from './storage'
import { useSessions } from './sessions'
import { daysBetween, startOfDay } from './progress'
import { estimateWorkout, workoutMeta } from './workout'
import { SPACE_RANK } from './labels'
import { countEvent } from './analytics'
import { registerReloader } from './reload'
import type {
  Category,
  Challenge,
  ChallengeDay,
  ChallengeEnrolment,
  CompletedSession,
  Equipment,
  Space,
  Workout,
} from '../types'

/*
  CHALLENGES — the running of one.

  Two halves live here. The top half describes a plan (how long, how many sessions,
  what kit) and needs nobody signed in. The bottom half is what happens once you
  start one.

  THE ONE DESIGN DECISION worth knowing about: a challenge stores no tick marks.
  All that is ever written down is which plan you're on and the date you began —
  everything else (which days are done, how far behind you are, whether you
  finished) is read back out of your training history every time it's displayed.

  That's what keeps it honest. A tick mark can outlive the session that earned it:
  delete a session from your history and a stored tick would still be sitting there
  claiming you did it. Deriving it means the plan and the history can never
  disagree, because there is only one of them.

  The cost is that "done" needs a rule, and this is it: a session day is done if a
  session of that workout appears in your history somewhere between the day the
  challenge started and today, and hasn't already been claimed by an earlier day of
  the plan. So training a day early counts, catching up two days late counts, and
  doing one session can never tick off two days that asked for it.
*/

// --- Describing a plan ---

export interface ChallengeSummary {
  weeks: number
  totalDays: number
  sessions: number
  minutes: number
  /** Sessions in the lightest and heaviest week — the same number twice if every week is the same. */
  sessionsPerWeek: [number, number]
  restPerWeek: [number, number]
  equipment: Equipment[]
  space: Space
  /** Where the plan's minutes go, by skill — measured exactly as one session's are. */
  categorySeconds: Partial<Record<Category, number>>
  /** 1–100, the same scale a session uses: every session in the plan, weighted by length. */
  efficiency: number | null
}

export function sessionDays(challenge: Challenge): ChallengeDay[] {
  return challenge.weeks.flatMap((w) => w.days).filter((d) => d.kind === 'session')
}

export function challengeSummary(challenge: Challenge): ChallengeSummary {
  let sessions = 0
  let seconds = 0
  let space: Space = 'small'
  const equipment = new Set<Equipment>()
  const categorySeconds: Partial<Record<Category, number>> = {}
  let scoredSeconds = 0
  let weightedScore = 0

  const perWeek = challenge.weeks.map((week) => {
    let count = 0
    for (const day of week.days) {
      if (day.kind !== 'session') continue
      count++
      const workout = workoutById[day.workoutId]
      if (!workout) continue
      const meta = workoutMeta(workout)
      seconds += meta.seconds
      meta.equipment.forEach((e) => equipment.add(e))
      if (SPACE_RANK[meta.space] > SPACE_RANK[space]) space = meta.space
      for (const [cat, secs] of Object.entries(meta.categorySeconds) as [Category, number][]) {
        categorySeconds[cat] = (categorySeconds[cat] ?? 0) + secs
      }
      // Weighted by length, exactly as a session weights its drills — a 40-minute
      // session has more say in what the plan is worth than a 10-minute one.
      if (meta.efficiency != null) {
        weightedScore += meta.efficiency * meta.seconds
        scoredSeconds += meta.seconds
      }
    }
    sessions += count
    return count
  })

  return {
    weeks: challenge.weeks.length,
    totalDays: challenge.weeks.length * 7,
    sessions,
    minutes: Math.round(seconds / 60),
    sessionsPerWeek: [Math.min(...perWeek), Math.max(...perWeek)],
    restPerWeek: [7 - Math.max(...perWeek), 7 - Math.min(...perWeek)],
    equipment: [...equipment],
    space,
    categorySeconds,
    efficiency: scoredSeconds > 0 ? Math.round(weightedScore / scoredSeconds) : null,
  }
}

// "3" or "4–5" — a plan with an easy week and a hard one should say so.
export function formatRange([low, high]: [number, number]): string {
  return low === high ? `${low}` : `${low}–${high}`
}

// --- Running one ---

export type DayStatus = 'done' | 'missed' | 'today' | 'upcoming' | 'rest'

export interface ChallengeDayView {
  /** 0-based across the whole plan. */
  index: number
  weekIndex: number
  dayOfWeek: number // 0–6 within its week
  date: Date // local midnight
  day: ChallengeDay
  workout: Workout | null
  minutes: number
  status: DayStatus
  isToday: boolean
  isPast: boolean
  /** The session that ticked this day off, when there is one. */
  session: CompletedSession | null
}

export interface ChallengeRun {
  enrolment: ChallengeEnrolment
  challenge: Challenge
  summary: ChallengeSummary
  days: ChallengeDayView[]
  start: Date
  end: Date // the last day of the plan
  /** 1-based day of the plan you're on. Below 1 before it starts, above totalDays after. */
  dayNumber: number
  /** 1-based week you're on, clamped into the plan. */
  weekNumber: number
  state: 'upcoming' | 'active' | 'finished' | 'left'
  startsInDays: number // 0 unless the plan starts in the future
  sessionsDone: number
  sessionsMissed: number
  /** Sessions the plan has asked for so far, today included. */
  sessionsDue: number
  percent: number
  today: ChallengeDayView | null
  /** The next session still to do, from today onwards. Null once nothing is left. */
  next: ChallengeDayView | null
}

/*
  Which history entry, if any, ticks off each day of the plan.

  Walked in plan order and each session claimed only once, so a plan that asks for
  Wall Work three times needs three Wall Works — the first one done can't satisfy
  all three. Days still in the future are never matched: a plan you're two days into
  has not "already done" next Friday, however much Wall Work you have in you.
*/
function matchHistory(
  days: ChallengeDay[],
  start: Date,
  sessions: CompletedSession[],
  now: Date,
): (CompletedSession | null)[] {
  const todayIndex = daysBetween(start, now)
  const lastIndex = days.length - 1
  const windowEnd = startOfDay(now).getTime()
  const windowStart = start.getTime()

  const candidates = sessions
    .filter((s) => {
      const at = startOfDay(new Date(s.completedAt)).getTime()
      return at >= windowStart && at <= windowEnd
    })
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())

  const claimed = new Set<string>()
  const matched: (CompletedSession | null)[] = days.map(() => null)

  for (let i = 0; i <= Math.min(todayIndex, lastIndex); i++) {
    const day = days[i]
    if (day.kind !== 'session') continue
    const hit = candidates.find((s) => !claimed.has(s.id) && s.workoutId === day.workoutId)
    if (hit) {
      claimed.add(hit.id)
      matched[i] = hit
    }
  }

  return matched
}

export function readRun(
  enrolment: ChallengeEnrolment,
  sessions: CompletedSession[],
  now = new Date(),
): ChallengeRun | null {
  const challenge = challengeById[enrolment.challengeId]
  if (!challenge) return null // a plan that no longer exists in this build

  const start = startOfDay(new Date(enrolment.startedAt))
  const flat = challenge.weeks.flatMap((w) => w.days)
  const matched = matchHistory(flat, start, sessions, now)
  const todayIndex = daysBetween(start, now)
  const today = startOfDay(now).getTime()

  const days: ChallengeDayView[] = flat.map((day, index) => {
    const date = new Date(start)
    date.setDate(date.getDate() + index)
    const workout = day.kind === 'session' ? workoutById[day.workoutId] ?? null : null
    const session = matched[index]
    const at = date.getTime()

    let status: DayStatus
    if (day.kind === 'rest') status = 'rest'
    else if (session) status = 'done'
    else if (at < today) status = 'missed'
    else if (at === today) status = 'today'
    else status = 'upcoming'

    return {
      index,
      weekIndex: Math.floor(index / 7),
      dayOfWeek: index % 7,
      date,
      day,
      workout,
      minutes: workout ? estimateWorkout(workout).minutes : 0,
      status,
      isToday: at === today,
      isPast: at < today,
      session,
    }
  })

  const summary = challengeSummary(challenge)
  const sessionsDone = days.filter((d) => d.status === 'done').length
  const sessionsMissed = days.filter((d) => d.status === 'missed').length
  const sessionsDue = days.filter((d) => d.day.kind === 'session' && (d.isPast || d.isToday)).length

  const end = new Date(start)
  end.setDate(end.getDate() + flat.length - 1)

  const state: ChallengeRun['state'] = enrolment.leftAt
    ? 'left'
    : todayIndex < 0
      ? 'upcoming'
      : todayIndex >= flat.length
        ? 'finished'
        : 'active'

  return {
    enrolment,
    challenge,
    summary,
    days,
    start,
    end,
    dayNumber: todayIndex + 1,
    weekNumber: Math.min(challenge.weeks.length, Math.max(1, Math.floor(todayIndex / 7) + 1)),
    state,
    startsInDays: Math.max(0, -todayIndex),
    sessionsDone,
    sessionsMissed,
    sessionsDue,
    percent: summary.sessions > 0 ? Math.round((sessionsDone / summary.sessions) * 100) : 0,
    today: todayIndex >= 0 && todayIndex < flat.length ? days[todayIndex] : null,
    next:
      days.find(
        (d) => d.day.kind === 'session' && !d.session && d.index >= Math.max(0, todayIndex),
      ) ?? null,
  }
}

// --- What you've signed up for ---

const store = createStore(loadChallenges(), saveChallenges)

export function useEnrolments(): ChallengeEnrolment[] {
  return useStore(store)
}

export function getEnrolments(): ChallengeEnrolment[] {
  return store.get()
}

/*
  The one you're on. A plan whose last day has passed is no longer running — it has
  finished, and finished is a result rather than a state you stay in — so it drops
  out of here and turns up in the list below instead.
*/
export function useCurrentRun(now = new Date()): ChallengeRun | null {
  const enrolments = useEnrolments()
  const sessions = useSessions()

  return useMemo(() => {
    for (const enrolment of [...enrolments].reverse()) {
      if (enrolment.leftAt) continue
      const run = readRun(enrolment, sessions, now)
      if (run && (run.state === 'active' || run.state === 'upcoming')) return run
    }
    return null
    // `now` is a fresh Date on every render, so it is deliberately not a dependency:
    // the day only changes once a day, and re-deriving on every keystroke elsewhere
    // would be work for nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrolments, sessions])
}

/** Every plan you've started, newest first — for the "you've done these" list. */
export function usePastRuns(now = new Date()): ChallengeRun[] {
  const enrolments = useEnrolments()
  const sessions = useSessions()

  return useMemo(() => {
    return [...enrolments]
      .reverse()
      .map((e) => readRun(e, sessions, now))
      .filter((run): run is ChallengeRun => run != null && (run.state === 'finished' || run.state === 'left'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrolments, sessions])
}

/** The run for one particular plan, whether it's the current one or an old attempt. */
export function useRunOf(challengeId: string | undefined, now = new Date()): ChallengeRun | null {
  const current = useCurrentRun(now)
  const past = usePastRuns(now)
  if (!challengeId) return null
  if (current?.challenge.id === challengeId) return current
  return past.find((run) => run.challenge.id === challengeId) ?? null
}

/*
  Starting one. Anything already running is marked as left first — being on two
  plans at once means being on neither, and the app would have to pick a favourite
  every time it wanted to say what today is for.
*/
export function startChallenge(challengeId: string, startOn: Date, now = new Date()): void {
  const stamp = new Date().toISOString()
  const kept = store.get().map((e) => {
    if (e.leftAt) return e
    // Read with no history on purpose: all that's wanted here is whether the plan is
    // still running, and that's a question about dates, not about what you've done.
    const run = readRun(e, [], now)
    if (run && (run.state === 'active' || run.state === 'upcoming')) return { ...e, leftAt: stamp }
    return e
  })

  store.set([
    ...kept,
    {
      id: `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      challengeId,
      startedAt: startOfDay(startOn).toISOString(),
      leftAt: null,
    },
  ])
  countEvent('challenge-started')
}

export function leaveChallenge(enrolmentId: string): void {
  const stamp = new Date().toISOString()
  store.set(store.get().map((e) => (e.id === enrolmentId ? { ...e, leftAt: stamp } : e)))
}

// Called by lib/auth.ts when the signed-in account changes.
export function reload(): void {
  reloadFrom(store, loadChallenges)
}

// Signing in or out and a cloud sync both swap this store's contents; see lib/reload.ts.
registerReloader(reload)

// --- Dates, said the way a person would ---

/*
  The Monday after today — offered as a start date alongside "today", because a plan
  that begins on a Monday lines its weeks up with the app's own Monday-to-Sunday
  weeks, and with how everyone talks about a training week.
*/
export function nextMonday(now = new Date()): Date {
  const d = startOfDay(now)
  const weekday = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() + (7 - weekday))
  return d
}

export function shortDate(date: Date): string {
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function weekdayShort(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short' })
}
