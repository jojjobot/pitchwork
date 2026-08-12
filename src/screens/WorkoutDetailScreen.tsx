import { Link, useNavigate, useParams } from 'react-router-dom'
import { workoutById } from '../data/workouts'
import { exerciseById } from '../data/exercises'
import { categoryMinutesSorted, workoutMeta } from '../lib/workout'
import { formatSeconds } from '../lib/format'
import {
  CATEGORY_ACCENT,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  SPACE_LABELS,
} from '../lib/labels'
import Badge from '../components/Badge'

export default function WorkoutDetailScreen() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  const workout = workoutId ? workoutById[workoutId] : undefined

  if (!workout) {
    return (
      <section className="text-center pt-10">
        <h1 className="font-display text-2xl font-bold">Workout not found</h1>
        <Link to="/workouts" className="mt-6 inline-block rounded-xl bg-ink px-4 h-11 leading-[44px] font-semibold text-chalk">
          Back to workouts
        </Link>
      </section>
    )
  }

  const meta = workoutMeta(workout)
  const kit = [...meta.equipment]
  const breakdown = categoryMinutesSorted(meta.categorySeconds)

  return (
    <section className="pb-24">
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
        <span aria-hidden="true">←</span> Back
      </button>

      <p className="text-sm font-bold uppercase tracking-widest" style={{ color: CATEGORY_ACCENT[workout.category] }}>
        {workout.code} · {CATEGORY_LABELS[workout.category]}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{workout.name}</h1>
      <p className="mt-1 font-semibold text-pitch">{workout.goal}</p>
      <p className="mt-3 text-slate leading-relaxed">{workout.description}</p>

      {/* Meta */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{meta.minutes} min</Badge>
        <Badge>{DIFFICULTY_LABELS[workout.difficulty]}</Badge>
        <Badge>{SPACE_LABELS[meta.space]}</Badge>
        {kit.length === 0 ? <Badge>No kit</Badge> : kit.map((e) => <Badge key={e}>{EQUIPMENT_LABELS[e]}</Badge>)}
      </div>

      {meta.equipment.has('partner') && (
        <p className="mt-3 rounded-xl bg-slate/10 px-4 py-2 text-sm text-slate">
          You'll need at least one other player for this session.
        </p>
      )}

      {/* Category breakdown */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate">What it trains</h2>
        <p className="mt-2 text-sm text-slate">{workout.focus}</p>
        <div className="mt-3 space-y-2">
          {breakdown.map(({ category, minutes }) => (
            <div key={category} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm font-medium">{CATEGORY_LABELS[category]}</span>
              <div className="h-2.5 flex-1 rounded-full bg-slate/15">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (minutes / meta.minutes) * 100)}%`,
                    backgroundColor: CATEGORY_ACCENT[category],
                  }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-sm text-slate">{minutes}m</span>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise list */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate">The session</h2>
        <ol className="mt-3 space-y-2">
          {workout.blocks.map((block, i) => {
            const ex = exerciseById[block.exerciseId]
            if (!ex) return null
            const isTimed = ex.measureType !== 'reps'
            const per = isTimed
              ? formatSeconds(block.duration ?? ex.defaultDuration)
              : `${block.reps ?? ex.defaultReps} reps`
            return (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-slate/15 bg-white/70 p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-bold text-chalk">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{ex.name}</p>
                  {block.note && <p className="truncate text-xs text-slate">{block.note}</p>}
                </div>
                <span className="shrink-0 text-sm font-medium text-slate">
                  {block.sets} × {per}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Start — fixed above the bottom nav so it's always reachable */}
      <div className="fixed inset-x-0 bottom-16 z-10 bg-gradient-to-t from-chalk via-chalk/95 to-transparent px-5 pt-6 pb-3">
        <div className="mx-auto max-w-md">
          <Link
            to={`/session/${workout.id}`}
            className="flex h-14 items-center justify-center rounded-2xl bg-blaze font-display text-lg font-extrabold text-white shadow-lg active:brightness-95"
          >
            Start training
          </Link>
        </div>
      </div>
    </section>
  )
}
