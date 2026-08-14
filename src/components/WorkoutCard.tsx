import { Link } from 'react-router-dom'
import type { Workout } from '../types'
import { workoutMeta } from '../lib/workout'
import { CATEGORY_ACCENT, CATEGORY_LABELS, DIFFICULTY_LABELS } from '../lib/labels'
import { EfficiencyBadge } from './Efficiency'
import PitchArt from './PitchArt'

/*
  A workout in the browse list. Shows its honest length, difficulty, and which
  skills it covers (as coloured dots). Tapping it opens the detail view.

  The picture is the session's own category — the one it's filed under — so
  scrolling the list of 70 gives you the shape of the programme at a glance
  without reading a single name.
*/
export default function WorkoutCard({ workout }: { workout: Workout }) {
  const meta = workoutMeta(workout)
  const cats = [...meta.categories]
  const needsPlayers = meta.equipment.has('partner')

  return (
    <Link to={`/workouts/${workout.id}`} className="card card-tap block p-4">
      <div className="flex items-start gap-3.5">
        <PitchArt
          category={workout.category}
          className="h-16 w-16 rounded-xl"
          seed={workout.id}
          label={CATEGORY_LABELS[workout.category]}
        />

        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold leading-tight text-ink">
            <span className="mr-1.5 text-slate tnum">{workout.code}</span>
            {workout.name}
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm text-slate">{workout.goal}</p>
        </div>

        {/* Length and worth, side by side — the two questions you ask of a session
            before you commit 40 minutes to it. */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-right">
            <p className="font-display text-2xl font-extrabold leading-none text-ink tnum">
              {meta.minutes}
            </p>
            <p className="text-xs text-slate">min</p>
          </div>
          {meta.efficiency != null && <EfficiencyBadge score={meta.efficiency} size="sm" />}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate/10 pt-3">
        {workout.isCustom && (
          <span className="rounded-full bg-pitch/12 px-2.5 py-1 text-xs font-semibold text-pitch">
            Yours
          </span>
        )}
        <span className="rounded-full bg-slate/12 px-2.5 py-1 text-xs font-medium capitalize text-slate">
          {DIFFICULTY_LABELS[workout.difficulty]}
        </span>
        {needsPlayers && (
          <span className="rounded-full bg-slate/12 px-2.5 py-1 text-xs font-medium text-slate">
            Needs players
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {cats.map((c) => (
            <span
              key={c}
              className="h-2.5 w-2.5 rounded-full ring-1 ring-white/60"
              style={{ backgroundColor: CATEGORY_ACCENT[c] }}
              title={CATEGORY_LABELS[c]}
              aria-label={CATEGORY_LABELS[c]}
            />
          ))}
        </div>
      </div>
    </Link>
  )
}
