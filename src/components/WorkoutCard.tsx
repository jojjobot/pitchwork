import { Link } from 'react-router-dom'
import type { Workout } from '../types'
import { workoutMeta } from '../lib/workout'
import { CATEGORY_ACCENT, CATEGORY_LABELS, DIFFICULTY_LABELS } from '../lib/labels'

/*
  A workout in the browse list. Shows its honest length, difficulty, and which
  skills it covers (as coloured dots). Tapping it opens the detail view.
*/
export default function WorkoutCard({ workout }: { workout: Workout }) {
  const meta = workoutMeta(workout)
  const cats = [...meta.categories]
  const needsPlayers = meta.equipment.has('partner')

  return (
    <Link
      to={`/workouts/${workout.id}`}
      className="block rounded-2xl border border-slate/15 bg-white/70 p-4 active:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-tight text-ink">
            <span className="mr-1.5 text-slate">{workout.code}</span>
            {workout.name}
          </p>
          <p className="mt-0.5 text-sm text-slate">{workout.goal}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-2xl font-extrabold leading-none text-ink">{meta.minutes}</p>
          <p className="text-xs text-slate">min</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-full bg-slate/15 px-2.5 py-1 text-xs font-medium capitalize text-slate">
          {DIFFICULTY_LABELS[workout.difficulty]}
        </span>
        {needsPlayers && (
          <span className="rounded-full bg-slate/15 px-2.5 py-1 text-xs font-medium text-slate">Needs players</span>
        )}
        <div className="flex items-center gap-1">
          {cats.map((c) => (
            <span
              key={c}
              className="h-2.5 w-2.5 rounded-full"
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
