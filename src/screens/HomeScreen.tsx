import { Link } from 'react-router-dom'
import { useSessions } from '../lib/sessions'
import { useSettings } from '../lib/settings'
import { useAllWorkouts } from '../lib/customWorkouts'
import { useCurrentRun } from '../lib/challenges'
import { relativeDay, suggestSession, summarize } from '../lib/progress'
import { workoutMeta } from '../lib/workout'
import { CATEGORY_LABELS } from '../lib/labels'
import ChallengeToday from '../components/ChallengeToday'
import GoalProgress from '../components/GoalProgress'
import PitchArt, { PitchBackdrop } from '../components/PitchArt'
import type { Category } from '../types'

/*
  The screen that answers "what am I doing today?" — and nothing else. Your week so
  far, one session picked out for you, and a way back to what you did last. Anything
  that isn't an answer to that question belongs on Progress.

  Visually this is the app's front page, so it's the one screen built around a
  full-bleed dark panel rather than a stack of white cards: the week's minutes are
  the headline, and the picture behind them is the skill you're being sent to train.
*/
export default function HomeScreen() {
  const sessions = useSessions()
  const settings = useSettings()
  const workouts = useAllWorkouts()
  const run = useCurrentRun()

  const stats = summarize(sessions)
  const suggestion = suggestSession(sessions, workouts)
  const trained = sessions.length > 0

  /*
    A challenge outranks the app's own suggestion — you already decided what today
    is for, and being asked again is what makes a plan stop working. The exception
    is a rest day or a plan that hasn't begun: then the suggestion comes back, under
    a heading that's honest about it being off-plan.
  */
  const onPlanToday = run != null && run.state === 'active' && run.today?.day.kind === 'session'
  const suggestionHeading = !run
    ? 'Suggested next'
    : run.state === 'upcoming'
      ? 'Until then'
      : 'Off the plan'

  return (
    <section>
      {/* ---- The hero: greeting, this week, and the streak ---- */}
      <div className="panel-deep relative overflow-hidden rounded-3xl p-6 shadow-lift">
        {/* The picture is the suggested session's skill, so the panel is about
            today rather than being decoration that never changes. */}
        {suggestion && <PitchBackdrop category={suggestion.workout.category} opacity={0.2} />}

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-chalk/55">{greeting()}</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-chalk">
                {trained ? 'Ready for another?' : "Let's get started."}
              </h1>
            </div>

            {/* The streak, in the one colour reserved for "you did a thing" */}
            {stats.streakDays > 0 && (
              <span className="flex shrink-0 flex-col items-center rounded-2xl bg-sun/15 px-3 py-2 ring-1 ring-sun/30">
                <span className="font-display text-2xl font-extrabold leading-none text-sun tnum">
                  {stats.streakDays}
                </span>
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-sun/80">
                  day{stats.streakDays === 1 ? '' : 's'}
                </span>
              </span>
            )}
          </div>

          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-chalk/45">This week</p>
            <div className="mt-2">
              <GoalProgress
                minutes={stats.thisWeekMinutes}
                goalMinutes={settings.weeklyGoalMinutes}
                tone="dark"
              />
            </div>
            {trained && stats.lastWeekMinutes > 0 && (
              <p className="mt-3 text-sm text-chalk/60">
                {comparison(stats.thisWeekMinutes, stats.lastWeekMinutes)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ---- Today, according to the plan ---- */}
      {run && (
        <div className="mt-5 rise" style={{ '--i': 1 } as React.CSSProperties}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate">Your challenge</h2>
          <div className="mt-2">
            <ChallengeToday run={run} />
          </div>
        </div>
      )}

      {/* ---- What to do next ---- */}
      {suggestion && !onPlanToday && (
        <div className="mt-5 rise" style={{ '--i': 1 } as React.CSSProperties}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate">
            {suggestionHeading}
          </h2>

          <Link
            to={`/workouts/${suggestion.workout.id}`}
            className="card card-tap mt-2 block overflow-hidden p-0"
          >
            {/* A wide crop of the skill's diagram across the top — the card now
                shows you the session instead of only naming it. */}
            <div className="relative h-24 w-full">
              <PitchArt
                category={suggestion.workout.category}
                className="h-24 w-full rounded-none"
                label={`${CATEGORY_LABELS[suggestion.workout.category]} session`}
              />
              <span className="absolute bottom-2 left-3 rounded-full bg-deep/55 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-chalk backdrop-blur">
                {CATEGORY_LABELS[suggestion.workout.category]}
              </span>
              <span className="absolute bottom-2 right-3 rounded-full bg-deep/55 px-2.5 py-1 text-[11px] font-bold text-chalk backdrop-blur tnum">
                {workoutMeta(suggestion.workout).minutes} min
              </span>
            </div>

            <div className="p-4">
              <p className="text-sm text-slate">{suggestion.reason}</p>
              <p className="mt-1.5 font-display text-xl font-bold leading-tight text-ink">
                <span className="mr-1.5 text-slate">{suggestion.workout.code}</span>
                {suggestion.workout.name}
              </p>
            </div>
          </Link>

          {/* The primary action in the whole app. It gets the glow and the sheen;
              nothing else does, so there is never a question of where to tap. */}
          <Link
            to={`/session/${suggestion.workout.id}`}
            className="sheen relative mt-3 flex h-15 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blaze font-display text-lg font-extrabold text-white shadow-glow transition-transform duration-200 active:scale-[0.985]"
          >
            Start training
            <span aria-hidden="true" className="text-xl">
              →
            </span>
          </Link>
        </div>
      )}

      {/* ---- Last time out ---- */}
      {stats.lastSession && (
        <div className="mt-7 rise" style={{ '--i': 2 } as React.CSSProperties}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate">Last session</h2>
            <Link to="/history" className="text-sm font-semibold text-pitch">
              All progress
            </Link>
          </div>
          <Link
            to={`/history/${stats.lastSession.id}`}
            className="card card-tap mt-2 flex items-center gap-3 p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{stats.lastSession.workoutName}</p>
              <p className="text-sm text-slate">{relativeDay(stats.lastSession.completedAt)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-2xl font-extrabold leading-none text-ink tnum">
                {stats.lastSession.totalMinutes}
              </p>
              <p className="text-xs text-slate">min</p>
            </div>
            <span className="shrink-0 text-lg text-slate" aria-hidden="true">
              ›
            </span>
          </Link>
        </div>
      )}

      {/* ---- Ways in ---- */}
      {/* Challenges only advertise themselves while you aren't on one; once you are,
          the card at the top of this screen is already saying it better. */}
      {!run && (
        <Link
          to="/challenges"
          className="card card-tap mt-7 flex items-center gap-3 p-4 rise"
          style={{ '--i': 3 } as React.CSSProperties}
        >
          <PitchArt category="athleticism" className="h-11 w-11 shrink-0 rounded-xl" />
          <span className="min-w-0 flex-1">
            <span className="block font-display font-bold text-ink">Take on a challenge</span>
            <span className="mt-0.5 block text-sm leading-snug text-slate">
              Two to six weeks, written out day by day — rest days included.
            </span>
          </span>
          <span className="shrink-0 text-lg text-slate" aria-hidden="true">
            ›
          </span>
        </Link>
      )}

      <div
        className={`${run ? 'mt-7' : 'mt-4'} grid grid-cols-2 gap-3 rise`}
        style={{ '--i': 4 } as React.CSSProperties}
      >
        <WayIn to="/workouts" title="Browse sessions" sub="Pick your own" category="passing" />
        <WayIn to="/builder" title="Build one" sub="Your sessions" category="dribbling" />
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

/* The two entry tiles. Each carries a small diagram so the pair reads as a
   choice between two places rather than two identical grey boxes. */
function WayIn({
  to,
  title,
  sub,
  category,
}: {
  to: string
  title: string
  sub: string
  category: Category
}) {
  return (
    <Link to={to} className="card card-tap flex flex-col gap-3 p-4">
      <PitchArt category={category} className="h-11 w-11 rounded-xl" />
      <span>
        <span className="block font-display font-bold text-ink">{title}</span>
        <span className="mt-0.5 block text-sm text-slate">{sub}</span>
      </span>
    </Link>
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
