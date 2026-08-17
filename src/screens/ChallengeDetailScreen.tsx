import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { challengeById } from '../data/challenges'
import { workoutById } from '../data/workouts'
import { estimateWorkout } from '../lib/workout'
import {
  challengeSummary,
  formatRange,
  leaveChallenge,
  nextMonday,
  shortDate,
  startChallenge,
  useCurrentRun,
  usePastRuns,
  weekdayShort,
  type ChallengeDayView,
  type ChallengeRun,
} from '../lib/challenges'
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  SPACE_LABELS,
} from '../lib/labels'
import Badge from '../components/Badge'
import CategoryBars from '../components/CategoryBars'
import NotFound from '../components/NotFound'
import PitchArt from '../components/PitchArt'
import StatTile from '../components/StatTile'
import { EfficiencyTile } from '../components/Efficiency'
import type { Challenge, ChallengeDay } from '../types'

/*
  One challenge: what it asks of you, and — once you've started it — where you are
  in it.

  The whole plan is on this page, all six weeks of it if that's what it is. No
  accordion, no "show more": a plan you can't read before you commit to it isn't a
  plan you can commit to. Today's row is the one that's highlighted, and it's the
  only row with a Start button on it.
*/
export default function ChallengeDetailScreen() {
  const { challengeId } = useParams()
  const navigate = useNavigate()
  const current = useCurrentRun()
  const past = usePastRuns()
  const [confirmLeave, setConfirmLeave] = useState(false)

  const challenge = challengeId ? challengeById[challengeId] : undefined
  if (!challenge) {
    return (
      <NotFound title="Challenge not found" to="/challenges" cta="Back to challenges">
        It may have been renamed in a newer version of the app.
      </NotFound>
    )
  }

  const summary = challengeSummary(challenge)
  // The run being shown: the live one if it's this plan, otherwise your last attempt
  // at it — so an old plan opens on the record of how it went, not a blank page.
  const mine = current?.challenge.id === challenge.id ? current : null
  const previous = past.find((run) => run.challenge.id === challenge.id) ?? null
  const run = mine ?? previous
  const busyElsewhere = current != null && current.challenge.id !== challenge.id

  const begin = (on: Date) => {
    startChallenge(challenge.id, on)
    // Straight back to the top of this page, now showing day 1.
    window.scrollTo({ top: 0 })
  }

  return (
    <section className="pb-28">
      {/* ---- Banner ---- */}
      <div className="relative -mx-5 -mt-6 mb-5 h-52 overflow-hidden">
        <PitchArt
          category={challenge.category}
          className="h-full w-full rounded-none"
          label={`${CATEGORY_LABELS[challenge.category]} challenge`}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to top, rgba(10,28,20,0.92) 8%, rgba(10,28,20,0.45) 46%, rgba(10,28,20,0.08) 100%)',
          }}
          aria-hidden="true"
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-deep/45 text-lg text-chalk backdrop-blur-sm active:bg-deep/70"
          aria-label="Back"
        >
          <span aria-hidden="true">←</span>
        </button>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-lime">
            {summary.weeks}-week challenge · {DIFFICULTY_LABELS[challenge.difficulty]}
          </p>
          <h1 className="mt-1.5 text-3xl font-extrabold leading-tight tracking-tight text-chalk">
            {challenge.name}
          </h1>
          <p className="mt-2 text-sm font-semibold text-chalk/75">{challenge.tagline}</p>
        </div>
      </div>

      {/* ---- Where you are, if you're in it ---- */}
      {mine && <RunPanel run={mine} />}
      {!mine && previous && <ResultPanel run={previous} />}

      <p className="mt-5 leading-relaxed text-slate">{challenge.description}</p>
      <p className="mt-3 rounded-2xl bg-pitch/8 px-4 py-3 text-sm font-semibold leading-relaxed text-pitch">
        {challenge.promise}
      </p>

      {/* ---- What it asks of you ---- */}
      <div className="mt-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate">What it asks of you</h2>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <StatTile value={summary.weeks} label="weeks" />
          <StatTile value={summary.sessions} label="sessions" />
          <StatTile value={formatRange(summary.restPerWeek)} label="rest days/wk" accent />
          <StatTile value={`${Math.round(summary.minutes / 60)}h`} label="total time" />
        </div>
        <p className="mt-2 text-sm text-slate">
          {formatRange(summary.sessionsPerWeek)} sessions a week, {formatRange(summary.restPerWeek)}{' '}
          days off. Sessions run {shortestLongest(challenge)}.
        </p>
      </div>

      {/* ---- Kit ---- */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge>{SPACE_LABELS[summary.space]}</Badge>
        {summary.equipment.length === 0 ? (
          <Badge>No kit</Badge>
        ) : (
          summary.equipment.map((e) => <Badge key={e}>{EQUIPMENT_LABELS[e]}</Badge>)
        )}
      </div>
      {summary.equipment.includes('partner') && (
        <p className="mt-3 rounded-xl bg-slate/10 px-4 py-2 text-sm text-slate">
          Some sessions in this plan need another player. They're marked in the calendar below.
        </p>
      )}

      {summary.efficiency != null && (
        <div className="mt-5">
          <EfficiencyTile
            score={summary.efficiency}
            what="Every session in the plan, weighted by how long you spend in each."
          />
        </div>
      )}

      {/* ---- What it trains ---- */}
      <div className="mt-7">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate">What it trains</h2>
        <div className="mt-3">
          <CategoryBars categorySeconds={summary.categorySeconds} totalMinutes={summary.minutes} />
        </div>
      </div>

      {/* ---- The plan ---- */}
      <div className="mt-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate">The plan</h2>
        <p className="mt-2 text-sm text-slate">
          {run
            ? 'Tap any session to read it. Rest days are days off — nothing to tick.'
            : 'Every day of it, before you commit. Tap any session to read what it involves.'}
        </p>

        <div className="mt-4 space-y-6">
          {challenge.weeks.map((week, weekIndex) => (
            <WeekBlock
              key={weekIndex}
              focus={week.focus}
              weekNumber={weekIndex + 1}
              days={
                run
                  ? run.days.filter((d) => d.weekIndex === weekIndex)
                  : week.days.map((day, i) => plainDay(weekIndex, i, day))
              }
              isCurrent={mine?.state === 'active' && mine.weekNumber === weekIndex + 1}
              dated={run != null}
            />
          ))}
        </div>
      </div>

      {/* ---- Leaving ---- */}
      {mine && (
        <div className="mt-8">
          {confirmLeave ? (
            <div className="card border-slate/25 p-4">
              <p className="font-semibold text-ink">Leave {challenge.name}?</p>
              <p className="mt-1 text-sm leading-relaxed text-slate">
                Your training history is untouched — every session you did stays exactly where it
                is. You lose the calendar, not the work.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    leaveChallenge(mine.enrolment.id)
                    setConfirmLeave(false)
                  }}
                  className="h-12 flex-1 rounded-xl bg-ink font-semibold text-chalk active:scale-[0.985]"
                >
                  Leave it
                </button>
                <button
                  onClick={() => setConfirmLeave(false)}
                  className="h-12 flex-1 rounded-xl border border-slate/20 bg-paper font-semibold text-ink active:bg-white/70"
                >
                  Stay on it
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmLeave(true)}
              className="h-12 w-full rounded-xl border border-slate/20 bg-paper font-semibold text-slate shadow-card active:bg-white/70"
            >
              Leave this challenge
            </button>
          )}
        </div>
      )}

      {/* ---- Starting ---- */}
      {!mine && (
        <div className="fixed inset-x-0 bottom-16 z-10 bg-gradient-to-t from-chalk via-chalk/95 to-transparent px-5 pt-6 pb-3">
          <div className="mx-auto max-w-md">
            {busyElsewhere && (
              <p className="mb-2 rounded-xl bg-sun/15 px-3 py-2 text-center text-xs font-semibold text-ink">
                Starting this closes {current!.challenge.name}.
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => begin(new Date())}
                className="sheen relative h-15 flex-1 overflow-hidden rounded-2xl bg-blaze font-display text-lg font-extrabold text-white shadow-glow transition-transform duration-200 active:scale-[0.985]"
              >
                {previous ? 'Run it again' : 'Start today'}
              </button>
              <button
                onClick={() => begin(nextMonday())}
                className="h-15 rounded-2xl border border-slate/25 bg-paper px-4 font-semibold text-ink shadow-card active:bg-white/70"
              >
                <span className="block text-sm leading-tight">Start Monday</span>
                <span className="block text-xs font-medium leading-tight text-slate tnum">
                  {shortDate(nextMonday())}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

/* ---------------------------------------------------------------- panels --- */

/*
  The live one. Deliberately the loudest thing on the page: if you're on a plan,
  "what am I doing today" outranks everything else the page has to say.
*/
function RunPanel({ run }: { run: ChallengeRun }) {
  const summary = run.summary
  const today = run.today
  const behind = run.sessionsMissed

  return (
    <div className="panel-deep relative overflow-hidden rounded-3xl p-5 shadow-lift">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-chalk/50">
          {run.state === 'upcoming'
            ? 'Not started yet'
            : `Week ${run.weekNumber} of ${summary.weeks} · day ${run.dayNumber}`}
        </p>
        <p className="font-display text-lg font-extrabold text-lime tnum">
          {run.sessionsDone}/{summary.sessions}
        </p>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-chalk/15">
        <div
          className="chalk-line h-full transition-[width] duration-700 ease-out"
          style={{ width: `${run.percent}%`, minWidth: run.sessionsDone > 0 ? '6px' : '0' }}
          role="progressbar"
          aria-valuenow={run.sessionsDone}
          aria-valuemin={0}
          aria-valuemax={summary.sessions}
          aria-label="Sessions done in this challenge"
        />
      </div>

      {run.state === 'upcoming' ? (
        <p className="mt-4 text-sm text-chalk/70">
          Day one is {weekdayShort(run.start)} {shortDate(run.start)}.
        </p>
      ) : today ? (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-chalk/50">Today</p>
          {today.day.kind === 'rest' ? (
            <>
              <p className="mt-1 font-display text-2xl font-extrabold text-chalk">Rest day</p>
              <p className="mt-1 text-sm leading-relaxed text-chalk/70">
                {today.day.note ?? "Nothing scheduled. That's the plan, not a gap in it."}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 font-display text-2xl font-extrabold leading-tight text-chalk">
                {today.workout?.name ?? 'Session'}
              </p>
              {today.day.note && (
                <p className="mt-1 text-sm leading-relaxed text-chalk/70">{today.day.note}</p>
              )}
              {today.status === 'done' ? (
                <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-lime/15 px-3 py-2 text-sm font-bold text-lime">
                  <span aria-hidden="true">✓</span> Done today
                </p>
              ) : (
                today.workout && (
                  <Link
                    to={`/session/${today.workout.id}`}
                    className="sheen relative mt-3 flex h-13 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blaze font-display text-base font-extrabold text-white shadow-glow active:scale-[0.985]"
                  >
                    Start today's session
                    <span aria-hidden="true">→</span>
                  </Link>
                )
              )}
            </>
          )}
        </div>
      ) : null}

      {behind > 0 && (
        <p className="mt-4 border-t border-chalk/12 pt-3 text-sm text-chalk/70">
          {behind} session{behind === 1 ? '' : 's'} missed so far. Missed days stay missed — pick the
          plan back up today rather than trying to do two.
        </p>
      )}
    </div>
  )
}

/* How an attempt that's over went. */
function ResultPanel({ run }: { run: ChallengeRun }) {
  const summary = run.summary
  const all = run.sessionsDone >= summary.sessions
  const left = run.enrolment.leftAt != null

  return (
    <div className="card p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-slate">
        {left ? 'You left this one' : 'Finished'}
      </p>
      <p className="mt-1 font-display text-2xl font-extrabold text-ink">
        {run.sessionsDone} of {summary.sessions} sessions
      </p>
      <p className="mt-1 text-sm leading-relaxed text-slate">
        {all
          ? `Every session, ${shortDate(run.start)} to ${shortDate(run.end)}. Nothing left to prove on this one.`
          : left
            ? `Started ${shortDate(run.start)}. The sessions you did are still in your history.`
            : `${shortDate(run.start)} to ${shortDate(run.end)}. Running it again starts a fresh calendar from today.`}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ week --- */

function WeekBlock({
  focus,
  weekNumber,
  days,
  isCurrent,
  dated,
}: {
  focus: string
  weekNumber: number
  days: ChallengeDayView[]
  isCurrent: boolean
  dated: boolean
}) {
  const sessions = days.filter((d) => d.day.kind === 'session').length

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3
          className={[
            'font-display text-lg font-bold',
            isCurrent ? 'text-pitch' : 'text-ink',
          ].join(' ')}
        >
          Week {weekNumber}
          <span className="ml-2 text-sm font-semibold text-slate">{focus}</span>
        </h3>
        <span className="shrink-0 text-xs font-semibold text-slate tnum">
          {sessions} · {7 - sessions} off
        </span>
      </div>
      {isCurrent && <div className="chalk-line mt-1.5 w-16" aria-hidden="true" />}

      <ol className="mt-2.5 space-y-1.5">
        {days.map((day) => (
          <DayRow key={day.index} day={day} dated={dated} />
        ))}
      </ol>
    </div>
  )
}

function DayRow({ day, dated }: { day: ChallengeDayView; dated: boolean }) {
  const rest = day.day.kind === 'rest'
  const label = dated
    ? `${weekdayShort(day.date)} ${shortDate(day.date)}`
    : `Day ${day.dayOfWeek + 1}`

  const body = (
    <>
      <span
        className={[
          'grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold',
          markClass(day),
        ].join(' ')}
        aria-hidden="true"
      >
        {mark(day)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate tnum">
          {label}
          {day.isToday && <span className="ml-1.5 text-blaze">· today</span>}
        </span>
        <span
          className={[
            'block truncate font-semibold',
            rest ? 'text-slate' : day.status === 'missed' ? 'text-slate' : 'text-ink',
          ].join(' ')}
        >
          {rest ? 'Rest' : (day.workout?.name ?? 'Session')}
        </span>
        {day.day.note && <span className="block truncate text-xs text-slate">{day.day.note}</span>}
      </span>

      {!rest && (
        <span className="shrink-0 text-right text-sm font-medium text-slate tnum">
          {day.minutes} min
        </span>
      )}
    </>
  )

  const tone = day.isToday
    ? 'border-blaze/45 bg-blaze/6'
    : rest
      ? 'border-transparent bg-slate/6'
      : 'border-slate/15 bg-paper/70'

  return (
    <li>
      {rest || !day.workout ? (
        <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${tone}`}>{body}</div>
      ) : (
        <Link
          to={`/workouts/${day.workout.id}`}
          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors active:bg-white ${tone}`}
        >
          {body}
        </Link>
      )}
    </li>
  )
}

/*
  One glyph per day, and it has to be readable at a glance down a column of 42 of
  them: a tick for done, a dash for a rest day, a cross for a session that went by
  without you, and the day's number for everything still ahead.
*/
function mark(day: ChallengeDayView): string {
  if (day.day.kind === 'rest') return '–'
  if (day.status === 'done') return '✓'
  if (day.status === 'missed') return '✕'
  return String(day.dayOfWeek + 1)
}

function markClass(day: ChallengeDayView): string {
  if (day.day.kind === 'rest') return 'bg-slate/12 text-slate'
  if (day.status === 'done') return 'bg-pitch text-white'
  if (day.status === 'missed') return 'bg-slate/15 text-slate'
  if (day.status === 'today') return 'bg-blaze text-white'
  return 'bg-ink/8 text-ink'
}

/* ---------------------------------------------------------------- helpers --- */

function minutesOf(workoutId: string): number {
  const workout = workoutById[workoutId]
  return workout ? estimateWorkout(workout).minutes : 0
}

/*
  The plan before you've started it. Same row component either way — it just has no
  dates to show, because the dates depend on when you begin, and inventing them
  would be the page guessing at a decision you haven't made.
*/
function plainDay(weekIndex: number, dayOfWeek: number, day: ChallengeDay): ChallengeDayView {
  const workout = day.kind === 'session' ? (workoutById[day.workoutId] ?? null) : null
  return {
    index: weekIndex * 7 + dayOfWeek,
    weekIndex,
    dayOfWeek,
    date: new Date(0),
    day,
    workout,
    minutes: workout ? minutesOf(workout.id) : 0,
    status: day.kind === 'rest' ? 'rest' : 'upcoming',
    isToday: false,
    isPast: false,
    session: null,
  }
}

// "12–35 min" — the range the sessions in this plan actually run to.
function shortestLongest(challenge: Challenge): string {
  const lengths = challenge.weeks
    .flatMap((w) => w.days)
    .flatMap((d) => (d.kind === 'session' ? [minutesOf(d.workoutId)] : []))
    .filter((m) => m > 0)
  if (lengths.length === 0) return 'as long as they need'
  const low = Math.min(...lengths)
  const high = Math.max(...lengths)
  return low === high ? `${low} min` : `${low}–${high} min`
}
