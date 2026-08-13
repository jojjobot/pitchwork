import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { duplicateExercise, useExercise } from '../lib/customExercises'
import { useWorkout } from '../lib/customWorkouts'
import {
  CATEGORY_ACCENT,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  efficiencyBand,
  EQUIPMENT_LABELS,
  SPACE_LABELS,
  trainedCategories,
} from '../lib/labels'
import { prescription, formatSeconds } from '../lib/format'
import Badge from '../components/Badge'
import NotFound from '../components/NotFound'

export default function ExerciseDetailScreen() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const ex = useExercise(exerciseId)

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
  const skills = trainedCategories(ex)
  const band = ex.efficiency != null ? efficiencyBand(ex.efficiency) : null

  return (
    <section>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
        <span aria-hidden="true">←</span> {fromWorkout ? `Back to ${fromWorkout.name}` : 'Back'}
      </button>

      {/* Every skill it works, filed one first. A drill that trains three things has
          no reason to introduce itself as one. */}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-widest">
        {skills.map((cat, i) => (
          <span key={cat} style={{ color: CATEGORY_ACCENT[cat] }}>
            {i > 0 && <span className="mr-2 text-slate/60">+</span>}
            {CATEGORY_LABELS[cat]}
          </span>
        ))}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{ex.name}</h1>
      {ex.isCustom && <p className="mt-1 text-sm font-semibold text-pitch">A drill you wrote</p>}
      <p className="mt-2 text-slate">{ex.shortDescription}</p>

      {/* What the score means, said plainly. The number alone invites the wrong
          reading — that a 50 is a bad drill rather than a narrower one. */}
      {band && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate/15 bg-white/70 p-4">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-lg font-extrabold text-white"
            style={{ backgroundColor: band.color }}
          >
            {ex.efficiency}
          </span>
          <div className="min-w-0">
            <p className="font-display font-bold text-ink">
              {band.label} <span className="font-body text-sm font-normal text-slate">· {ex.efficiency}/100 efficiency</span>
            </p>
            <p className="mt-0.5 text-sm text-slate">{band.blurb}</p>
          </div>
        </div>
      )}

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

      {/* Instructions. A drill you just created has none yet — an empty numbered list
          under a heading reads as broken, so say what's missing instead. */}
      <div className="mt-8">
        <h2 className="text-lg font-bold">How to do it</h2>
        <div className="chalk-line mt-2 w-14" aria-hidden="true" />
        {ex.instructions.length === 0 ? (
          <p className="mt-4 text-slate">
            No steps written yet.{' '}
            {ex.isCustom && (
              <Link to={`/library/${ex.id}/edit`} className="font-semibold text-pitch underline">
                Add them
              </Link>
            )}
          </p>
        ) : (
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
        )}
      </div>

      {/* Coaching cues */}
      {ex.coachingCues.length > 0 && (
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
      )}

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

      {/*
        The library is read-only for the same reason the programme is: everyone's copy
        of a built-in drill should say the same thing. Wanting to change one is normal,
        so the way through is a copy of your own — the same "make it mine" move that
        sessions already offer.
      */}
      {ex.isCustom ? (
        <Link
          to={`/library/${ex.id}/edit`}
          className="mt-3 flex h-12 items-center justify-center rounded-xl bg-ink font-semibold text-chalk active:brightness-110"
        >
          Edit this drill
        </Link>
      ) : (
        <button
          onClick={() => navigate(`/library/${duplicateExercise(ex).id}/edit`)}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-slate/25 bg-white font-semibold active:bg-white/60"
        >
          Make my own version
        </button>
      )}
    </section>
  )
}
