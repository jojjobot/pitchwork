import { Link } from 'react-router-dom'
import type { Exercise } from '../types'
import { CATEGORY_ACCENT, CATEGORY_LABELS, efficiencyBand } from '../lib/labels'
import { prescription } from '../lib/format'

/*
  One row in the exercise library. Tapping it opens the drill's detail screen.
  The whole card is the tap target so it's easy to hit one-handed.
*/
export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const band = exercise.efficiency != null ? efficiencyBand(exercise.efficiency) : null
  const also = exercise.alsoTrains ?? []

  return (
    <Link
      to={`/library/${exercise.id}`}
      className="flex items-center gap-3 rounded-2xl border border-slate/15 bg-white/70 p-4 active:bg-white"
    >
      {/* The score, in its band's colour — this is the first thing worth reading in a
          list of 172 drills, so it takes the slot the category spine used to hold and
          keeps the spine as a thin edge beside it. */}
      {band ? (
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-base font-extrabold text-white"
          style={{ backgroundColor: band.color }}
          title={`${band.label} — ${exercise.efficiency}/100 efficiency`}
        >
          {exercise.efficiency}
        </span>
      ) : (
        <span
          className="h-10 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: CATEGORY_ACCENT[exercise.category] }}
          aria-hidden="true"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-display font-bold text-ink leading-tight">
          {exercise.name}
          {/* The score marks the built-in library's own judgement; this marks the ones
              you wrote, which is the only distinction that matters side by side. */}
          {exercise.isCustom && <span className="ml-1.5 text-xs font-semibold text-pitch">Yours</span>}
        </p>
        <p className="mt-0.5 truncate text-sm text-slate">
          {exercise.shortDescription || 'No description yet'}
        </p>
        {/* The other skills it works. A dot each, so a drill that trains three things
            says so without a second line of text. */}
        {also.length > 0 && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: CATEGORY_ACCENT[exercise.category] }}
              aria-hidden="true"
            />
            {also.map((cat) => (
              <span
                key={cat}
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORY_ACCENT[cat] }}
                aria-hidden="true"
              />
            ))}
            <span className="truncate">also {also.map((c) => CATEGORY_LABELS[c].toLowerCase()).join(' + ')}</span>
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display font-bold text-ink">{prescription(exercise)}</p>
        <p className="text-xs text-slate capitalize">{exercise.difficulty}</p>
      </div>
    </Link>
  )
}
