import { Link } from 'react-router-dom'
import { shortDate, weekdayShort, type ChallengeRun } from '../lib/challenges'

/*
  Today, according to the plan you're on. Home's answer to "what am I doing today?"
  whenever a challenge is running, and it outranks the app's own suggestion — the
  point of committing to a calendar is not being asked again every morning.

  Four things it can say, and they're genuinely different: do this, you've done it,
  today is a rest day, or the plan hasn't started yet. A rest day is stated as
  plainly as a session, because a plan that only speaks up on training days quietly
  teaches you that the rest days are optional.
*/
export default function ChallengeToday({ run }: { run: ChallengeRun }) {
  const today = run.today
  const eyebrow =
    run.state === 'upcoming'
      ? run.challenge.name
      : `${run.challenge.name} · week ${run.weekNumber} of ${run.summary.weeks}`

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-slate/12 bg-pitch/8 px-4 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-pitch">
          {eyebrow}
        </span>
        <span className="ml-auto shrink-0 text-[11px] font-bold text-pitch tnum">
          {run.sessionsDone}/{run.summary.sessions}
        </span>
      </div>

      <div className="p-4">
        {run.state === 'upcoming' ? (
          <>
            <p className="font-display text-xl font-bold leading-tight text-ink">
              Starts {weekdayShort(run.start)} {shortDate(run.start)}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate">
              {run.startsInDays === 1 ? 'Tomorrow.' : `${run.startsInDays} days away.`} Train
              whatever you like until then.
            </p>
          </>
        ) : today?.day.kind === 'rest' ? (
          <>
            <p className="font-display text-xl font-bold leading-tight text-ink">Rest day</p>
            <p className="mt-1 text-sm leading-relaxed text-slate">
              {today.day.note ?? "Nothing scheduled today. That's the plan, not a gap in it."}
            </p>
            {run.next && (
              <p className="mt-2 text-sm text-slate">
                Next up: <span className="font-semibold text-ink">{run.next.workout?.name}</span>,{' '}
                {weekdayShort(run.next.date)} {shortDate(run.next.date)}.
              </p>
            )}
          </>
        ) : today?.status === 'done' ? (
          <>
            <p className="font-display text-xl font-bold leading-tight text-ink">
              <span className="mr-1.5 text-pitch" aria-hidden="true">
                ✓
              </span>
              Today's session is done
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate">
              {today.workout?.name}. Day {run.dayNumber} of {run.summary.totalDays}.
            </p>
            {run.next && (
              <p className="mt-2 text-sm text-slate">
                Next up: <span className="font-semibold text-ink">{run.next.workout?.name}</span>,{' '}
                {weekdayShort(run.next.date)} {shortDate(run.next.date)}.
              </p>
            )}
          </>
        ) : today?.workout ? (
          <>
            <p className="font-display text-xl font-bold leading-tight text-ink">
              {today.workout.name}
            </p>
            <p className="mt-1 text-sm text-slate">
              <span className="tnum">{today.minutes} min</span> · day {run.dayNumber} of{' '}
              {run.summary.totalDays}
            </p>
            {today.day.note && (
              <p className="mt-2 rounded-xl bg-slate/8 px-3 py-2 text-sm leading-relaxed text-slate">
                {today.day.note}
              </p>
            )}
            <Link
              to={`/session/${today.workout.id}`}
              className="sheen relative mt-3 flex h-15 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blaze font-display text-lg font-extrabold text-white shadow-glow transition-transform duration-200 active:scale-[0.985]"
            >
              Start today's session
              <span aria-hidden="true" className="text-xl">
                →
              </span>
            </Link>
          </>
        ) : null}

        <Link
          to={`/challenges/${run.challenge.id}`}
          className="mt-3 block text-sm font-semibold text-pitch"
        >
          See the whole plan →
        </Link>
      </div>
    </div>
  )
}
