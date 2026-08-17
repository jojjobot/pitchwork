import { Link } from 'react-router-dom'
import { challengeSummary, formatRange, type ChallengeRun } from '../lib/challenges'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '../lib/labels'
import PitchArt from './PitchArt'
import type { Challenge } from '../types'

/*
  One plan, on the browse list.

  The three numbers on it are the ones people actually choose between: how many
  weeks, how many sessions a week, and how many rest days. Length alone doesn't
  say much — six weeks at three sessions is a lighter commitment than four weeks
  at five, and the card has to make that obvious before you open it.

  `run` is passed when this is the plan you're currently on, and then the card
  swaps its numbers for where you've got to.
*/
export default function ChallengeCard({
  challenge,
  run = null,
}: {
  challenge: Challenge
  run?: ChallengeRun | null
}) {
  const summary = challengeSummary(challenge)
  const hours = Math.round(summary.minutes / 60)

  return (
    <Link to={`/challenges/${challenge.id}`} className="card card-tap block overflow-hidden p-0">
      <div className="relative h-24 w-full">
        <PitchArt
          category={challenge.category}
          className="h-24 w-full rounded-none"
          label={`${CATEGORY_LABELS[challenge.category]} challenge`}
        />
        <span className="absolute bottom-2 left-3 rounded-full bg-deep/55 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-chalk backdrop-blur tnum">
          {summary.weeks} weeks
        </span>
        <span className="absolute bottom-2 right-3 rounded-full bg-deep/55 px-2.5 py-1 text-[11px] font-bold text-chalk backdrop-blur">
          {DIFFICULTY_LABELS[challenge.difficulty]}
        </span>
        {run && (
          <span className="absolute right-3 top-3 rounded-full bg-blaze px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            You're on it
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="font-display text-xl font-bold leading-tight text-ink">{challenge.name}</p>
        <p className="mt-1 text-sm leading-snug text-slate">{challenge.tagline}</p>

        {run ? (
          <div className="mt-3">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-semibold text-ink">
                Week {run.weekNumber} · day {run.dayNumber} of {summary.totalDays}
              </span>
              <span className="font-semibold text-pitch tnum">
                {run.sessionsDone}/{summary.sessions} done
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate/20">
              <div
                className="chalk-line h-full transition-[width] duration-700 ease-out"
                style={{ width: `${run.percent}%`, minWidth: run.sessionsDone > 0 ? '6px' : '0' }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate">
            <span>
              <span className="font-semibold text-ink tnum">
                {formatRange(summary.sessionsPerWeek)}
              </span>{' '}
              sessions a week
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <span className="font-semibold text-ink tnum">{formatRange(summary.restPerWeek)}</span>{' '}
              rest days
            </span>
            <span aria-hidden="true">·</span>
            <span className="tnum">~{hours} h total</span>
          </div>
        )}
      </div>
    </Link>
  )
}
