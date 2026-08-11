import { Link, useNavigate, useParams } from 'react-router-dom'
import { exerciseById } from '../data/exercises'
import { CATEGORY_ACCENT, CATEGORY_LABELS, DIFFICULTY_LABELS, EQUIPMENT_LABELS, SPACE_LABELS } from '../lib/labels'
import { prescription, formatSeconds } from '../lib/format'
import Badge from '../components/Badge'

export default function ExerciseDetailScreen() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const ex = exerciseId ? exerciseById[exerciseId] : undefined

  // Guard against a bad or old link.
  if (!ex) {
    return (
      <section className="text-center pt-10">
        <h1 className="font-display text-2xl font-bold">Drill not found</h1>
        <p className="mt-2 text-slate">It may have been renamed or removed.</p>
        <Link to="/library" className="mt-6 inline-block rounded-xl bg-ink px-4 h-11 leading-[44px] font-semibold text-chalk">
          Back to the library
        </Link>
      </section>
    )
  }

  const kit = ex.equipment.filter((e) => e !== 'none')

  return (
    <section>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
        <span aria-hidden="true">←</span> Back
      </button>

      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: CATEGORY_ACCENT[ex.category] }}>
        {CATEGORY_LABELS[ex.category]}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{ex.name}</h1>
      <p className="mt-2 text-slate">{ex.shortDescription}</p>

      {/* Meta */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge dot={CATEGORY_ACCENT[ex.category]}>{DIFFICULTY_LABELS[ex.difficulty]}</Badge>
        <Badge>{SPACE_LABELS[ex.spaceNeeded]}</Badge>
        <Badge>{prescription(ex)}</Badge>
        {ex.defaultSets > 1 && <Badge>{formatSeconds(ex.restBetweenSets)} rest</Badge>}
        {kit.length === 0 ? <Badge>No kit</Badge> : kit.map((e) => <Badge key={e}>{EQUIPMENT_LABELS[e]}</Badge>)}
      </div>

      {/* Instructions */}
      <div className="mt-8">
        <h2 className="text-lg font-bold">How to do it</h2>
        <div className="chalk-line mt-2 w-14" aria-hidden="true" />
        <ol className="mt-4 space-y-3">
          {ex.instructions.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-bold text-chalk">
                {i + 1}
              </span>
              <span className="pt-0.5 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Coaching cues */}
      <div className="mt-8 rounded-2xl bg-ink p-5 text-chalk">
        <h2 className="font-display text-lg font-bold text-lime">Coaching cues</h2>
        <ul className="mt-3 space-y-2">
          {ex.coachingCues.map((cue, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-lime" aria-hidden="true">✓</span>
              <span className="leading-relaxed">{cue}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Skill tags */}
      {ex.skillTags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {ex.skillTags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate/15 px-3 py-1 text-xs font-medium text-slate">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Placeholder for a later phase */}
      <p className="mt-8 text-sm text-slate">
        You'll be able to add this drill to a custom workout once the builder ships (Phase 3).
      </p>
    </section>
  )
}
