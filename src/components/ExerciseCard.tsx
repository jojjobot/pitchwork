import { Link } from 'react-router-dom'
import type { Exercise } from '../types'
import { CATEGORY_ACCENT } from '../lib/labels'
import { prescription } from '../lib/format'

/*
  One row in the exercise library. Tapping it opens the drill's detail screen.
  The whole card is the tap target so it's easy to hit one-handed.
*/
export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link
      to={`/library/${exercise.id}`}
      className="flex items-center gap-3 rounded-2xl border border-slate/15 bg-white/70 p-4 active:bg-white"
    >
      {/* category colour spine */}
      <span
        className="h-10 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: CATEGORY_ACCENT[exercise.category] }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="font-display font-bold text-ink leading-tight">
          {exercise.rank != null && (
            <span className="mr-1.5 text-slate">#{exercise.rank}</span>
          )}
          {exercise.name}
        </p>
        <p className="mt-0.5 truncate text-sm text-slate">{exercise.shortDescription}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display font-bold text-ink">{prescription(exercise)}</p>
        <p className="text-xs text-slate capitalize">{exercise.difficulty}</p>
      </div>
    </Link>
  )
}
