import { Link } from 'react-router-dom'
import { challenges } from '../data/challenges'
import { challengeSummary, shortDate, useCurrentRun, usePastRuns } from '../lib/challenges'
import ChallengeCard from '../components/ChallengeCard'
import type { ChallengeRun } from '../lib/challenges'

/*
  The list of plans.

  Ordered shortest first, so the two-week one is the first thing a new person sees.
  Committing to six weeks of anything is a big ask; committing to ten short sessions
  is not, and the order is the app's opinion about which to try first.
*/
export default function ChallengesScreen() {
  const current = useCurrentRun()
  const past = usePastRuns()

  const ordered = [...challenges].sort((a, b) => a.weeks.length - b.weeks.length)
  const rest = ordered.filter((c) => c.id !== current?.challenge.id)

  return (
    <section>
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Challenges</h1>
        <div className="chalk-line mt-2 w-20" aria-hidden="true" />
        <p className="mt-3 leading-relaxed text-slate">
          A challenge is a calendar, not a suggestion. Two to six weeks, written out day by day —
          which session you do, and which days you don't train at all.
        </p>
      </header>

      {current && (
        <div className="mt-6 rise">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate">
            {current.state === 'upcoming' ? 'Starting soon' : 'Your challenge'}
          </h2>
          <div className="mt-2">
            <ChallengeCard challenge={current.challenge} run={current} />
          </div>
          <p className="mt-2 px-1 text-sm text-slate">{todayLine(current)}</p>
        </div>
      )}

      <div className="mt-7 rise" style={{ '--i': 1 } as React.CSSProperties}>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate">
          {current ? 'The others' : 'Pick one'}
        </h2>
        <div className="mt-2 space-y-3">
          {rest.map((challenge, i) => (
            <div key={challenge.id} className="rise" style={{ '--i': i + 2 } as React.CSSProperties}>
              <ChallengeCard challenge={challenge} />
            </div>
          ))}
        </div>
      </div>

      {past.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate">Behind you</h2>
          <ul className="mt-2 space-y-2">
            {past.map((run) => (
              <li key={run.enrolment.id}>
                <Link
                  to={`/challenges/${run.challenge.id}`}
                  className="card card-tap flex items-center gap-3 p-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{run.challenge.name}</p>
                    <p className="text-sm text-slate">{pastLine(run)}</p>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="block font-display text-xl font-extrabold leading-none text-ink tnum">
                      {run.sessionsDone}
                      <span className="text-sm font-bold text-slate">
                        /{challengeSummary(run.challenge).sessions}
                      </span>
                    </span>
                    <span className="text-[11px] text-slate">sessions</span>
                  </span>
                  <span className="shrink-0 text-slate" aria-hidden="true">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!current && (
        <p className="mt-8 rounded-2xl border border-dashed border-slate/30 p-5 text-sm leading-relaxed text-slate">
          You can only be on one at a time — a plan that has to compete with another plan isn't
          telling you what to do today. Starting a second one closes the first.
        </p>
      )}
    </section>
  )
}

function todayLine(run: ChallengeRun): string {
  if (run.state === 'upcoming') {
    return run.startsInDays === 1
      ? 'Starts tomorrow.'
      : `Starts in ${run.startsInDays} days, on ${shortDate(run.start)}.`
  }
  const today = run.today
  if (!today) return ''
  if (today.day.kind === 'rest') return "Today is a rest day. That's the plan, not a gap in it."
  if (today.status === 'done') return `Today's session is done. ${today.workout?.name ?? ''}`.trim()
  return `Today: ${today.workout?.name ?? 'a session'}.`
}

function pastLine(run: ChallengeRun): string {
  const summary = challengeSummary(run.challenge)
  const when = run.enrolment.leftAt
    ? `Left ${shortDate(new Date(run.enrolment.leftAt))}`
    : `Finished ${shortDate(run.end)}`
  if (run.sessionsDone >= summary.sessions) return `${when} · every session done`
  return `${when} · started ${shortDate(run.start)}`
}
