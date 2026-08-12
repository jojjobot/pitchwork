import { Link } from 'react-router-dom'
import { useSessions } from '../lib/sessions'
import { useSettings } from '../lib/settings'
import { useAllWorkouts } from '../lib/customWorkouts'
import { relativeDay, suggestSession, summarize } from '../lib/progress'
import { workoutMeta } from '../lib/workout'
import { CATEGORY_ACCENT, CATEGORY_LABELS } from '../lib/labels'
import GoalProgress from '../components/GoalProgress'

/*
  The screen that answers "what am I doing today?" — and nothing else. Your week so
  far, one session picked out for you, and a way back to what you did last. Anything
  that isn't an answer to that question belongs on Progress.
*/
export default function HomeScreen() {
  const sessions = useSessions()
  const settings = useSettings()
  const workouts = useAllWorkouts()

  const stats = summarize(sessions)
  const suggestion = suggestSession(sessions, workouts)
  const trained = sessions.length > 0

  return (
    <section>
      <header>
        <p className="text-sm font-semibold text-slate">{greeting()}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          {trained ? 'Ready for another?' : "Let's get started."}
        </h1>
        <div className="chalk-line mt-2 w-20" aria-hidden="true" />
      </header>

      {/* This week */}
      <div className="mt-6 rounded-2xl border border-slate/15 bg-white/70 p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">This week</h2>
          {stats.streakDays > 0 && (
            <p className="text-sm font-semibold text-pitch">
              {stats.streakDays}-day streak
            </p>
          )}
        </div>
        <div className="mt-2">
          <GoalProgress minutes={stats.thisWeekMinutes} goalMinutes={settings.weeklyGoalMinutes} />
        </div>
        {trained && stats.lastWeekMinutes > 0 && (
          <p className="mt-3 text-sm text-slate">
            {comparison(stats.thisWeekMinutes, stats.lastWeekMinutes)}
          </p>
        )}
      </div>

      {/* What to do next */}
      {suggestion && (
        <div className="mt-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">Suggested next</h2>
          <Link
            to={`/workouts/${suggestion.workout.id}`}
            className="mt-2 block rounded-2xl border border-slate/15 bg-white/70 p-4 active:bg-white"
          >
            <p className="text-sm text-slate">{suggestion.reason}</p>
            <p className="mt-2 font-display text-xl font-bold leading-tight text-ink">
              <span className="mr-1.5 text-slate">{suggestion.workout.code}</span>
              {suggestion.workout.name}
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span
                className="font-semibold"
                style={{ color: CATEGORY_ACCENT[suggestion.workout.category] }}
              >
                {CATEGORY_LABELS[suggestion.workout.category]}
              </span>
              <span className="text-slate">·</span>
              <span className="text-slate">{workoutMeta(suggestion.workout).minutes} min</span>
            </div>
          </Link>
          <Link
            to={`/session/${suggestion.workout.id}`}
            className="mt-2 flex h-14 items-center justify-center rounded-2xl bg-blaze font-display text-lg font-extrabold text-white shadow-sm active:brightness-95"
          >
            Start training
          </Link>
        </div>
      )}

      {/* Last time out */}
      {stats.lastSession && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">Last session</h2>
            <Link to="/history" className="text-sm font-semibold text-pitch">
              All progress
            </Link>
          </div>
          <Link
            to={`/history/${stats.lastSession.id}`}
            className="mt-2 flex items-center gap-3 rounded-2xl border border-slate/15 bg-white/70 p-4 active:bg-white"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{stats.lastSession.workoutName}</p>
              <p className="text-sm text-slate">{relativeDay(stats.lastSession.completedAt)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-xl font-extrabold leading-none text-ink">
                {stats.lastSession.totalMinutes}
              </p>
              <p className="text-xs text-slate">min</p>
            </div>
            <span className="shrink-0 text-slate" aria-hidden="true">
              ›
            </span>
          </Link>
        </div>
      )}

      {/* Ways in */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link
          to="/workouts"
          className="rounded-2xl border border-slate/15 bg-white/70 p-4 active:bg-white"
        >
          <p className="font-display font-bold text-ink">Browse sessions</p>
          <p className="mt-0.5 text-sm text-slate">Pick your own</p>
        </Link>
        <Link
          to="/builder"
          className="rounded-2xl border border-slate/15 bg-white/70 p-4 active:bg-white"
        >
          <p className="font-display font-bold text-ink">Build one</p>
          <p className="mt-0.5 text-sm text-slate">Your sessions</p>
        </Link>
      </div>

      {!trained && (
        <p className="mt-6 text-sm leading-relaxed text-slate">
          Nothing in your history yet. Finish a session and this screen starts tracking your week,
          your streak, and which skills you've been avoiding.
        </p>
      )}
    </section>
  )
}

function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// Quote the actual numbers rather than a vague "keep it up".
function comparison(thisWeek: number, lastWeek: number): string {
  const diff = thisWeek - lastWeek
  if (diff === 0) return `Level with last week (${lastWeek} min).`
  if (diff > 0) return `${diff} min more than last week (${lastWeek} min).`
  return `${-diff} min behind last week (${lastWeek} min).`
}
