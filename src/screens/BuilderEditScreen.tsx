import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useExerciseLookup } from '../lib/customExercises'
import {
  deleteCustomWorkout,
  updateBlocks,
  updateCustomWorkout,
  useWorkout,
} from '../lib/customWorkouts'
import { blockPrescription, moveBlock } from '../lib/builder'
import { workoutMeta } from '../lib/workout'
import { formatSeconds } from '../lib/format'
import {
  CATEGORY_ACCENT,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  SPACE_LABELS,
} from '../lib/labels'
import Badge from '../components/Badge'
import CategoryBars from '../components/CategoryBars'
import NotFound from '../components/NotFound'
import type { Workout } from '../types'

/*
  Editing one of your sessions. Every change is saved the moment you make it — there
  is no Save button to forget on a phone, and no draft that can be lost.

  The panel at the top is the point of the whole screen: it is not a guess or a
  target you type in, it is this session measured by the same code the player runs.
  Change a set here and the number above moves.
*/
export default function BuilderEditScreen() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  const workout = useWorkout(workoutId)
  const lookup = useExerciseLookup()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (!workout || !workout.isCustom) {
    return (
      <NotFound title="Session not found" to="/builder" cta="Back to your sessions">
        {workout ? 'The programme sessions are read-only — make a copy to edit one.' : 'It may have been deleted.'}
      </NotFound>
    )
  }

  const meta = workoutMeta(workout)
  const kit = [...meta.equipment]
  const empty = workout.blocks.length === 0
  const minutes = empty ? 0 : meta.minutes

  const set = (patch: Partial<Workout>) => updateCustomWorkout(workout.id, patch)

  const remove = () => {
    deleteCustomWorkout(workout.id)
    navigate('/builder')
  }

  return (
    <section className="pb-24">
      <button
        onClick={() => navigate('/builder')}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate"
      >
        <span aria-hidden="true">←</span> Your sessions
      </button>

      {/* Name and intent — the only things the app can't work out for itself. */}
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate">Session name</span>
        <input
          value={workout.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Untitled session"
          className="mt-1 w-full rounded-xl border border-slate/25 bg-white px-4 h-12 font-display text-lg font-bold outline-none focus:border-pitch"
        />
      </label>

      <label className="mt-3 block">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate">
          What it's for <span className="font-normal normal-case tracking-normal">(optional)</span>
        </span>
        <input
          value={workout.goal}
          onChange={(e) => set({ goal: e.target.value })}
          placeholder="e.g. A cleaner first touch under pressure"
          className="mt-1 w-full rounded-xl border border-slate/25 bg-white px-4 h-12 outline-none focus:border-pitch"
        />
      </label>

      {/* Live measurement */}
      <div className="mt-5 rounded-2xl border border-slate/15 bg-white/70 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate">This session</p>
            <p className="font-display text-4xl font-extrabold leading-none text-ink">
              {minutes}
              <span className="ml-1 text-base font-bold text-slate">min</span>
            </p>
          </div>
          <p className="text-right text-sm text-slate">
            {empty ? (
              'Nothing in it yet'
            ) : (
              <>
                {workout.blocks.length} {workout.blocks.length === 1 ? 'drill' : 'drills'}
                <br />
                {formatSeconds(meta.seconds)} total
              </>
            )}
          </p>
        </div>

        {!empty && (
          <>
            <div className="mt-4">
              <CategoryBars categorySeconds={meta.categorySeconds} totalMinutes={meta.minutes} />
            </div>

            {/* Filed automatically, so it can never contradict the drills above. */}
            <p className="mt-4 text-sm text-slate">
              Filed under{' '}
              <span className="font-semibold" style={{ color: CATEGORY_ACCENT[workout.category] }}>
                {CATEGORY_LABELS[workout.category]}
              </span>{' '}
              — where most of your time goes.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{DIFFICULTY_LABELS[workout.difficulty]}</Badge>
              <Badge>{SPACE_LABELS[meta.space]}</Badge>
              {kit.length === 0 ? <Badge>No kit</Badge> : kit.map((e) => <Badge key={e}>{EQUIPMENT_LABELS[e]}</Badge>)}
            </div>
          </>
        )}
      </div>

      {/* The drills */}
      <div className="mt-7">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate">The session</h2>
        {empty ? (
          <p className="mt-2 text-slate">Add your first drill below.</p>
        ) : (
          <p className="mt-2 text-sm text-slate">Tap a drill to change its numbers.</p>
        )}

        <ol className="mt-3 space-y-2">
          {workout.blocks.map((block, i) => {
            const ex = lookup(block.exerciseId)
            if (!ex) return null
            const last = i === workout.blocks.length - 1
            return (
              <li key={`${block.exerciseId}-${i}`} className="rounded-xl border border-slate/15 bg-white/70">
                <div className="flex items-center gap-2 p-2">
                  {/* Reorder. Plain buttons rather than drag-and-drop: they work with
                      one thumb, on a touchscreen, without a library. */}
                  <div className="flex shrink-0 flex-col gap-1">
                    <ReorderButton
                      label={`Move ${ex.name} up`}
                      disabled={i === 0}
                      onClick={() => updateBlocks(workout.id, (b) => moveBlock(b, i, -1))}
                    >
                      ↑
                    </ReorderButton>
                    <ReorderButton
                      label={`Move ${ex.name} down`}
                      disabled={last}
                      onClick={() => updateBlocks(workout.id, (b) => moveBlock(b, i, 1))}
                    >
                      ↓
                    </ReorderButton>
                  </div>

                  <Link
                    to={`/builder/${workout.id}/block/${i}`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 active:bg-slate/10"
                  >
                    <span
                      className="h-9 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: CATEGORY_ACCENT[ex.category] }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{ex.name}</span>
                      <span className="block truncate text-xs text-slate">
                        {blockPrescription(ex, block)}
                        {block.note ? ` · ${block.note}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-slate" aria-hidden="true">
                      ›
                    </span>
                  </Link>
                </div>

                {/* The gap before the next drill, shown where it actually happens. */}
                {!last && block.restAfter > 0 && (
                  <p className="border-t border-dashed border-slate/20 px-4 py-1.5 text-xs text-slate">
                    {formatSeconds(block.restAfter)} rest before the next drill
                  </p>
                )}
              </li>
            )
          })}
        </ol>

        <Link
          to={`/builder/${workout.id}/add`}
          className="mt-3 flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-slate/40 font-semibold text-pitch active:bg-white"
        >
          <span aria-hidden="true">+</span> Add a drill
        </Link>
      </div>

      {/* Notes */}
      <label className="mt-7 block">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate">
          Notes <span className="font-normal normal-case tracking-normal">(optional)</span>
        </span>
        <textarea
          value={workout.description}
          onChange={(e) => set({ description: e.target.value })}
          rows={3}
          placeholder="Anything you want to remember about this session."
          className="mt-1 w-full resize-y rounded-xl border border-slate/25 bg-white px-4 py-3 outline-none focus:border-pitch"
        />
      </label>

      {/* Delete */}
      <div className="mt-8 rounded-2xl border border-slate/15 p-4">
        {confirmingDelete ? (
          <>
            <p className="font-semibold text-ink">Delete "{workout.name}"?</p>
            <p className="mt-1 text-sm text-slate">
              This can't be undone. Sessions you've already trained stay in your history.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={remove}
                className="h-11 flex-1 rounded-xl bg-blaze font-semibold text-white active:brightness-95"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="h-11 flex-1 rounded-xl border border-slate/25 bg-white font-semibold text-ink"
              >
                Keep it
              </button>
            </div>
          </>
        ) : (
          <button onClick={() => setConfirmingDelete(true)} className="h-11 w-full text-sm font-semibold text-slate">
            Delete this session
          </button>
        )}
      </div>

      {/* Start — matches the ready-made sessions, but only once there's something to run */}
      <div className="fixed inset-x-0 bottom-16 z-10 bg-gradient-to-t from-chalk via-chalk/95 to-transparent px-5 pt-6 pb-3">
        <div className="mx-auto max-w-md">
          {empty ? (
            <p className="flex h-14 items-center justify-center rounded-2xl bg-slate/20 font-display text-lg font-extrabold text-slate">
              Add a drill to start
            </p>
          ) : (
            <Link
              to={`/session/${workout.id}`}
              className="flex h-14 items-center justify-center rounded-2xl bg-blaze font-display text-lg font-extrabold text-white shadow-lg active:brightness-95"
            >
              Start training
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

function ReorderButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled: boolean
  children: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-lg border border-slate/25 bg-white text-sm text-ink disabled:opacity-30"
    >
      {children}
    </button>
  )
}
