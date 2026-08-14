import { Link } from 'react-router-dom'
import { useSessions } from '../lib/sessions'
import { useSettings } from '../lib/settings'
import { relativeDay, summarize, weeklyMinutes } from '../lib/progress'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../lib/labels'
import CategoryBars from '../components/CategoryBars'
import WeeklyChart from '../components/WeeklyChart'
import StatTile from '../components/StatTile'

/*
  Everything you've actually done. The order is deliberate: this week first (the
  thing you can still change), then the trend, then where your time goes, then the
  log itself. Totals last, because they're the least actionable number here.
*/
export default function HistoryScreen() {
  const sessions = useSessions()
  const settings = useSettings()
  const stats = summarize(sessions)
  const weeks = weeklyMinutes(sessions, 12)

  if (sessions.length === 0) {
    return (
      <section>
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight">Progress</h1>
          <div className="chalk-line mt-2 w-20" aria-hidden="true" />
        </header>
        <div className="mt-6 rounded-2xl border border-dashed border-slate/30 p-8 text-center">
          <p className="font-display text-lg font-bold">No sessions yet</p>
          <p className="mt-2 text-slate">
            Finish a session and save it, and this screen fills in: minutes per week, the skills
            you've been neglecting, and every session you've done.
          </p>
          <Link
            to="/workouts"
            className="mt-5 inline-block rounded-xl bg-ink px-4 h-11 leading-[44px] font-semibold text-chalk"
          >
            Find a session
          </Link>
        </div>
      </section>
    )
  }

  // Skills you've never touched are worth naming — they won't show up in the bars.
  const untouched = CATEGORY_ORDER.filter(
    (c) => c !== 'recovery' && !stats.categoryMinutes[c],
  )
  const stalest = (Object.entries(stats.daysSince) as [keyof typeof CATEGORY_LABELS, number][])
    .filter(([, days]) => days >= 7)
    .sort((a, b) => b[1] - a[1])[0]

  return (
    <section>
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Progress</h1>
        <div className="chalk-line mt-2 w-20" aria-hidden="true" />
        <p className="mt-3 text-slate">
          {stats.totalSessions} {stats.totalSessions === 1 ? 'session' : 'sessions'},{' '}
          {stats.totalMinutes} minutes on the pitch.
        </p>
      </header>

      {/* Headline numbers. The streak is the only one that gets colour — it's the
          only one of the three that's an achievement rather than a count. */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatTile value={stats.thisWeekMinutes} label="min this week" />
        <StatTile value={stats.streakDays} label="day streak" accent={stats.streakDays > 0} />
        <StatTile value={stats.totalSessions} label="sessions" />
      </div>

      {/* Trend */}
      <div className="mt-7">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate">Minutes per week</h2>
        <div className="card mt-3 p-4">
          <WeeklyChart weeks={weeks} goalMinutes={settings.weeklyGoalMinutes} />
        </div>
      </div>

      {/* Where the time goes */}
      <div className="mt-7">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate">Where your time goes</h2>
        <p className="mt-2 text-sm text-slate">All-time, across every session you've saved.</p>
        <div className="card mt-3 p-4">
          <CategoryBars
            categorySeconds={Object.fromEntries(
              Object.entries(stats.categoryMinutes).map(([c, m]) => [c, m * 60]),
            )}
            totalMinutes={stats.totalMinutes}
          />
        </div>

        {(stalest || untouched.length > 0) && (
          <div className="mt-4 rounded-xl bg-slate/10 px-4 py-3 text-sm text-slate">
            {stalest && (
              <p>
                You haven't trained{' '}
                <span className="font-semibold text-ink">
                  {CATEGORY_LABELS[stalest[0]].toLowerCase()}
                </span>{' '}
                in {stalest[1]} days.
              </p>
            )}
            {untouched.length > 0 && (
              <p className={stalest ? 'mt-1' : ''}>
                Never trained: {untouched.map((c) => CATEGORY_LABELS[c].toLowerCase()).join(', ')}.
              </p>
            )}
          </div>
        )}
      </div>

      {/* The log */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate">Every session</h2>
        <ol className="mt-3 space-y-2">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                to={`/history/${session.id}`}
                className="card card-tap flex items-center gap-3 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{session.workoutName}</p>
                  <p className="text-xs text-slate">
                    {relativeDay(session.completedAt)}
                    {session.perceivedEffort != null && ` · effort ${session.perceivedEffort}/5`}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-slate tnum">
                  {session.totalMinutes} min
                </span>
                <span className="shrink-0 text-slate" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
