import { Link, useNavigate, useParams } from 'react-router-dom'
import { useExerciseLookup } from '../lib/customExercises'
import { duplicateWorkout, useWorkout } from '../lib/customWorkouts'
import { workoutMeta } from '../lib/workout'
import { formatSeconds } from '../lib/format'
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  SPACE_LABELS,
} from '../lib/labels'
import Badge from '../components/Badge'
import CategoryBars from '../components/CategoryBars'
import NotFound from '../components/NotFound'
import PitchArt from '../components/PitchArt'
import { EfficiencyTile } from '../components/Efficiency'

export default function WorkoutDetailScreen() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  const workout = useWorkout(workoutId)
  const lookup = useExerciseLookup()

  if (!workout) {
    return (
      <NotFound title="Workout not found" to="/workouts" cta="Back to workouts">
        It may have been deleted.
      </NotFound>
    )
  }

  const meta = workoutMeta(workout)
  const kit = [...meta.equipment]

  // The programme is read-only. Wanting to change a session is normal, so the way
  // through is a copy of your own rather than a locked screen.
  const makeItMine = () => {
    navigate(`/builder/${duplicateWorkout(workout).id}`)
  }

  return (
    <section className="pb-24">
      {/*
        The banner. It breaks the shell's padding on purpose (-mx-5 -mt-6) so the
        session's own picture runs edge to edge — this is the screen you look at
        while deciding to commit 40 minutes, and it should look like something.
      */}
      <div className="relative -mx-5 -mt-6 mb-5 h-52 overflow-hidden">
        <PitchArt
          category={workout.category}
          className="h-full w-full rounded-none"
          label={`${CATEGORY_LABELS[workout.category]} session`}
        />
        {/* The scrim: the title has to stay readable over every one of the eight
            plates, so the bottom half darkens rather than trusting the artwork. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to top, rgba(10,28,20,0.92) 8%, rgba(10,28,20,0.45) 46%, rgba(10,28,20,0.08) 100%)',
          }}
          aria-hidden="true"
        />

        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-deep/45 text-lg text-chalk backdrop-blur-sm active:bg-deep/70"
          aria-label="Back"
        >
          <span aria-hidden="true">←</span>
        </button>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-lime">
            {workout.code} · {CATEGORY_LABELS[workout.category]}
            {workout.isCustom && <span className="text-chalk/60"> · Yours</span>}
          </p>
          <h1 className="mt-1.5 text-3xl font-extrabold leading-tight tracking-tight text-chalk">
            {workout.name}
          </h1>
          <p className="mt-2 flex items-center gap-3 text-sm font-semibold text-chalk/75">
            <span className="tnum">{meta.minutes} min</span>
            <span aria-hidden="true">·</span>
            <span>{workout.blocks.length} drills</span>
            <span aria-hidden="true">·</span>
            <span>{DIFFICULTY_LABELS[workout.difficulty]}</span>
          </p>
        </div>
      </div>

      {workout.goal && <p className="font-semibold text-pitch">{workout.goal}</p>}
      {workout.description && <p className="mt-2 text-slate leading-relaxed">{workout.description}</p>}

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

      {meta.efficiency != null && (
        <div className="mt-4">
          <EfficiencyTile
            score={meta.efficiency}
            what="The average of this session's drills, weighted by how long you spend on each."
          />
        </div>
      )}

      {/* Category breakdown */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate">What it trains</h2>
        {/* Sessions you build don't write a focus line — the bars say it better. */}
        {workout.focus && <p className="mt-2 text-sm text-slate">{workout.focus}</p>}
        <div className="mt-3">
          <CategoryBars categorySeconds={meta.categorySeconds} totalMinutes={meta.minutes} />
        </div>
      </div>

      {/* Exercise list */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate">The session</h2>
        <p className="mt-2 text-sm text-slate">Tap any drill to see how to do it.</p>
        <ol className="mt-3 space-y-2">
          {workout.blocks.map((block, i) => {
            const ex = lookup(block.exerciseId)
            if (!ex) return null
            const isTimed = ex.measureType !== 'reps'
            const per = isTimed
              ? formatSeconds(block.duration ?? ex.defaultDuration)
              : `${block.reps ?? ex.defaultReps} reps`
            return (
              <li key={i}>
                {/* Opens the drill's own page, told which session sent you so it can
                    show this workout's numbers instead of the drill's defaults. */}
                <Link
                  to={`/library/${ex.id}?from=${workout.id}&block=${i}`}
                  className="card card-tap flex items-center gap-3 p-3"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-bold text-chalk tnum">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{ex.name}</p>
                    {block.note && <p className="truncate text-xs text-slate">{block.note}</p>}
                  </div>
                  <span className="shrink-0 text-sm font-medium text-slate">
                    {block.sets} × {per}
                  </span>
                  <span className="shrink-0 text-slate" aria-hidden="true">
                    ›
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Change it — edit your own, or take a copy of a programme session */}
      <div className="mt-6">
        {workout.isCustom ? (
          <Link
            to={`/builder/${workout.id}`}
            className="flex h-12 items-center justify-center rounded-xl border border-slate/20 bg-paper shadow-card font-semibold text-ink active:bg-white/70"
          >
            Edit this session
          </Link>
        ) : (
          <>
            <button
              onClick={makeItMine}
              className="flex h-12 w-full items-center justify-center rounded-xl border border-slate/20 bg-paper shadow-card font-semibold text-ink active:bg-white/70"
            >
              Make it mine
            </button>
            <p className="mt-2 text-center text-xs text-slate">
              Copies {workout.code} into your own sessions, yours to change.
            </p>
          </>
        )}
      </div>

      {/* Start — fixed above the bottom nav so it's always reachable */}
      <div className="fixed inset-x-0 bottom-16 z-10 bg-gradient-to-t from-chalk via-chalk/95 to-transparent px-5 pt-6 pb-3">
        <div className="mx-auto max-w-md">
          <Link
            to={`/session/${workout.id}`}
            className="sheen relative flex h-15 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blaze font-display text-lg font-extrabold text-white shadow-glow transition-transform duration-200 active:scale-[0.985]"
          >
            Start training
            <span aria-hidden="true" className="text-xl">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
