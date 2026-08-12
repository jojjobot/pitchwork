import { Link, useNavigate, useParams } from 'react-router-dom'
import { exerciseById } from '../data/exercises'
import { updateBlocks, useWorkout } from '../lib/customWorkouts'
import { blockSeconds, removeBlock, replaceBlock } from '../lib/builder'
import { formatSeconds } from '../lib/format'
import { CATEGORY_ACCENT, CATEGORY_LABELS } from '../lib/labels'
import Stepper from '../components/Stepper'
import NotFound from '../components/NotFound'
import type { WorkoutBlock } from '../types'

/*
  One drill inside one of your sessions.

  The controls you get depend on how the drill is measured, and that is not a style
  choice. A timed drill counts down in the player, so it has seconds. A rep drill is
  self-paced — you press Done when you've finished your reps — so it has reps, plus a
  separate estimate of how long a set takes, purely so the session length stays
  honest. Giving a rep drill a duration would turn it into a countdown, so there is
  simply no control here that can do it.
*/
export default function BuilderBlockScreen() {
  const { workoutId, blockIndex } = useParams()
  const navigate = useNavigate()
  const workout = useWorkout(workoutId)

  const index = Number(blockIndex)
  const block = workout && Number.isInteger(index) ? workout.blocks[index] : undefined
  const ex = block ? exerciseById[block.exerciseId] : undefined

  if (!workout || !workout.isCustom || !block || !ex) {
    return (
      <NotFound title="Drill not found" to={workout ? `/builder/${workout.id}` : '/builder'} cta="Back to the session">
        It may have been removed from this session.
      </NotFound>
    )
  }

  const back = `/builder/${workout.id}`
  const isTimed = ex.measureType !== 'reps'
  const isLast = index === workout.blocks.length - 1

  // What each control shows: the block's own value if you've set one, otherwise the
  // drill's default. A null here isn't missing data — it means "whatever the drill says".
  const seconds = block.duration ?? ex.defaultDuration
  const reps = block.reps ?? ex.defaultReps ?? 10
  const restBetween = block.restBetweenSets ?? ex.restBetweenSets
  const perSet = blockSeconds({ ...block, sets: 1 })

  const edit = (patch: Partial<WorkoutBlock>) =>
    updateBlocks(workout.id, (blocks) => replaceBlock(blocks, index, { ...block, ...patch }))

  const remove = () => {
    updateBlocks(workout.id, (blocks) => removeBlock(blocks, index))
    navigate(back)
  }

  return (
    <section className="pb-8">
      <button
        onClick={() => navigate(back)}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate"
      >
        <span aria-hidden="true">←</span> Back to {workout.name}
      </button>

      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: CATEGORY_ACCENT[ex.category] }}>
        Drill {index + 1} of {workout.blocks.length} · {CATEGORY_LABELS[ex.category]}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{ex.name}</h1>
      <p className="mt-2 text-slate">{ex.shortDescription}</p>

      <Link to={`/library/${ex.id}?from=${workout.id}&block=${index}`} className="mt-3 inline-block text-sm font-semibold text-pitch">
        How to do it →
      </Link>

      {/* What this drill costs the session, updating as you tap. */}
      <div className="mt-5 rounded-2xl bg-ink p-4 text-chalk">
        <p className="text-xs font-semibold uppercase tracking-wider text-lime">This drill costs</p>
        <p className="mt-1 font-display text-3xl font-extrabold leading-none">
          {formatSeconds(blockSeconds(block))}
        </p>
        <p className="mt-1 text-sm text-chalk/70">
          {block.sets} × {formatSeconds(perSet)}
          {block.sets > 1 && ` + ${block.sets - 1} × ${formatSeconds(restBetween)} rest`}
        </p>
      </div>

      <div className="mt-6 space-y-6 rounded-2xl border border-slate/15 bg-white/70 p-4">
        <Stepper
          label="Sets"
          value={block.sets}
          min={1}
          max={30}
          onChange={(sets) => edit({ sets })}
          hint={`Drill suggests ${ex.defaultSets}`}
        />

        {isTimed ? (
          <Stepper
            label="Seconds per set"
            value={seconds}
            min={5}
            max={900}
            step={5}
            format={formatSeconds}
            onChange={(duration) => edit({ duration })}
            hint={`Drill default ${formatSeconds(ex.defaultDuration)}`}
            onReset={block.duration != null ? () => edit({ duration: null }) : undefined}
          />
        ) : (
          <>
            <Stepper
              label="Reps per set"
              value={reps}
              min={1}
              max={200}
              onChange={(value) => edit({ reps: value })}
              hint={`Drill default ${ex.defaultReps ?? '—'}`}
              onReset={block.reps != null ? () => edit({ reps: null }) : undefined}
            />
            {/* Self-paced in the player; this only keeps the advertised length honest. */}
            <Stepper
              label="How long a set takes"
              value={perSet}
              min={5}
              max={900}
              step={5}
              format={formatSeconds}
              onChange={(estimateSeconds) => edit({ estimateSeconds })}
              hint={
                block.estimateSeconds == null
                  ? 'Estimated from the reps — no timer either way'
                  : 'Your estimate — no timer either way'
              }
              onReset={block.estimateSeconds != null ? () => edit({ estimateSeconds: null }) : undefined}
            />
          </>
        )}

        {block.sets > 1 && (
          <Stepper
            label="Rest between sets"
            value={restBetween}
            min={0}
            max={300}
            step={5}
            format={formatSeconds}
            onChange={(value) => edit({ restBetweenSets: value })}
            hint={`Drill default ${formatSeconds(ex.restBetweenSets)}`}
            onReset={block.restBetweenSets != null ? () => edit({ restBetweenSets: null }) : undefined}
          />
        )}

        {isLast ? (
          <p className="text-sm text-slate">
            Last drill in the session — there's nothing to rest before, so the session ends here.
          </p>
        ) : (
          <Stepper
            label="Rest before the next drill"
            value={block.restAfter}
            min={0}
            max={600}
            step={15}
            format={formatSeconds}
            onChange={(restAfter) => edit({ restAfter })}
          />
        )}

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate">
            Note <span className="font-normal normal-case tracking-normal">(optional)</span>
          </span>
          <input
            value={block.note ?? ''}
            onChange={(e) => edit({ note: e.target.value.trim() === '' ? null : e.target.value })}
            placeholder="e.g. Weak foot only"
            className="mt-1 w-full rounded-xl border border-slate/25 bg-white px-4 h-12 outline-none focus:border-pitch"
          />
          <span className="mt-1 block text-xs text-slate">Shown on screen while you train.</span>
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => navigate(back)}
          className="h-12 flex-1 rounded-xl bg-ink font-semibold text-chalk active:brightness-110"
        >
          Done
        </button>
        <button onClick={remove} className="h-12 rounded-xl border border-slate/25 bg-white px-4 font-semibold text-blaze">
          Remove
        </button>
      </div>
    </section>
  )
}
