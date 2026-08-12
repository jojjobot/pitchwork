import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { exerciseById } from '../data/exercises'
import { useWorkout } from '../lib/customWorkouts'
import { CATEGORY_ACCENT, CATEGORY_LABELS, DIFFICULTY_LABELS, EQUIPMENT_LABELS, SPACE_LABELS } from '../lib/labels'
import { prescription, formatSeconds } from '../lib/format'
import Badge from '../components/Badge'
import NotFound from '../components/NotFound'

export default function ExerciseDetailScreen() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const ex = exerciseId ? exerciseById[exerciseId] : undefined

  // Arrived from a workout? Then that session's prescription is what matters here,
  // not the drill's own defaults. Read from the URL so the link survives a refresh.
  const fromWorkout = useWorkout(params.get('from') ?? undefined)
  const rawBlock = params.get('block')
  const blockIndex = rawBlock == null ? -1 : Number(rawBlock)
  const block = fromWorkout && Number.isInteger(blockIndex) ? fromWorkout.blocks[blockIndex] : undefined
  const inSession = block?.exerciseId === exerciseId ? block : undefined

  // Guard against a bad or old link.
  if (!ex) {
    return (
      <NotFound title="Drill not found" to="/library" cta="Back to the library">
        It may have been renamed or removed.
      </NotFound>
    )
  }

  const kit = ex.equipment.filter((e) => e !== 'none')

  return (
    <section>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
        <span aria-hidden="true">←</span> {fromWorkout ? `Back to ${fromWorkout.name}` : 'Back'}
      </button>

      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: CATEGORY_ACCENT[ex.category] }}>
        {CATEGORY_LABELS[ex.category]}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{ex.name}</h1>
      {ex.rank != null && (
        <p className="mt-1 text-sm font-semibold text-slate">
          #{ex.rank} most effective in {CATEGORY_LABELS[ex.category]}
        </p>
      )}
      <p className="mt-2 text-slate">{ex.shortDescription}</p>

      {/* Meta */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge dot={CATEGORY_ACCENT[ex.category]}>{DIFFICULTY_LABELS[ex.difficulty]}</Badge>
        <Badge>{SPACE_LABELS[ex.spaceNeeded]}</Badge>
        <Badge>{prescription(ex)}</Badge>
        {ex.defaultSets > 1 && <Badge>{formatSeconds(ex.restBetweenSets)} rest</Badge>}
        {kit.length === 0 ? <Badge>No kit</Badge> : kit.map((e) => <Badge key={e}>{EQUIPMENT_LABELS[e]}</Badge>)}
      </div>

      {/* What this particular session asks of you — overrides the defaults above. */}
      {inSession && fromWorkout && (
        <div className="mt-5 rounded-2xl border border-slate/15 bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate">
            In {fromWorkout.code} · {fromWorkout.name}
          </p>
          <p className="mt-1 font-display text-xl font-bold text-ink">
            {inSession.sets} ×{' '}
            {ex.measureType === 'reps'
              ? `${inSession.reps ?? ex.defaultReps} reps`
              : formatSeconds(inSession.duration ?? ex.defaultDuration)}
            {inSession.sets > 1 && (
              <span className="ml-2 text-base font-semibold text-slate">
                {formatSeconds(inSession.restBetweenSets ?? ex.restBetweenSets)} rest
              </span>
            )}
          </p>
          {inSession.note && <p className="mt-1 text-sm text-slate">{inSession.note}</p>}
        </div>
      )}

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

      {/* Straight into the builder, carrying this drill with it. */}
      <Link
        to={`/builder?add=${ex.id}`}
        className="mt-8 flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-slate/40 font-semibold text-pitch active:bg-white"
      >
        <span aria-hidden="true">+</span> Add to one of your sessions
      </Link>
    </section>
  )
}
