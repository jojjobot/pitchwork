import { Link } from 'react-router-dom'
import type { Exercise } from '../types'
import { CATEGORY_ACCENT, CATEGORY_LABELS } from '../lib/labels'
import { prescription } from '../lib/format'
import { EfficiencyBadge } from './Efficiency'
import PitchArt from './PitchArt'

/*
  One row in the exercise library. Tapping it opens the drill's detail screen.
  The whole card is the tap target so it's easy to hit one-handed.

  Three columns, in the order you actually read them: the picture tells you what
  kind of drill this is before you've read a word, the middle says what it is, and
  the score says whether it's worth your time.
*/
export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const also = exercise.alsoTrains ?? []

  return (
    <Link to={`/library/${exercise.id}`} className="card card-tap flex items-center gap-3.5 p-3.5">
      <PitchArt
        category={exercise.category}
        className="h-14 w-14 rounded-xl"
        seed={exercise.id}
        label={CATEGORY_LABELS[exercise.category]}
      />

      <div className="min-w-0 flex-1">
        <p className="font-display font-bold leading-tight text-ink">
          {exercise.name}
          {/* The score marks the built-in library's own judgement; this marks the ones
              you wrote, which is the only distinction that matters side by side. */}
          {exercise.isCustom && (
            <span className="ml-1.5 align-middle rounded-full bg-pitch/12 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pitch">
              Yours
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-sm text-slate">
          {exercise.shortDescription || 'No description yet'}
        </p>

        <p className="mt-1.5 flex items-center gap-2 text-xs text-slate">
          <span className="font-semibold text-ink/70 tnum">{prescription(exercise)}</span>
          <span aria-hidden="true">·</span>
          <span className="capitalize">{exercise.difficulty}</span>

          {/* The other skills it works. A dot each, so a drill that trains three
              things says so without a second line of text. */}
          {also.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                {also.map((cat) => (
                  <span
                    key={cat}
                    className="h-2 w-2 shrink-0 rounded-full ring-1 ring-white/60"
                    style={{ backgroundColor: CATEGORY_ACCENT[cat] }}
                    title={`Also trains ${CATEGORY_LABELS[cat].toLowerCase()}`}
                    aria-label={`Also trains ${CATEGORY_LABELS[cat].toLowerCase()}`}
                  />
                ))}
              </span>
            </>
          )}
        </p>
      </div>

      {exercise.efficiency != null && <EfficiencyBadge score={exercise.efficiency} />}
    </Link>
  )
}
