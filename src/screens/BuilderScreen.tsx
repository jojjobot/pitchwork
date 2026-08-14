import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useExercise } from '../lib/customExercises'
import {
  createCustomWorkout,
  updateBlocks,
  useCustomWorkouts,
} from '../lib/customWorkouts'
import { newBlockFor } from '../lib/builder'
import { workoutMeta } from '../lib/workout'
import { CATEGORY_ACCENT, CATEGORY_LABELS } from '../lib/labels'

/*
  Your own sessions. Normally this is a list you tap to edit — but arriving from a
  drill page with ?add=<drill> turns it into "which session should this go in?",
  which is why that link exists at the bottom of every drill.
*/
export default function BuilderScreen() {
  const navigate = useNavigate()
  const mine = useCustomWorkouts()
  const [params] = useSearchParams()
  const adding = useExercise(params.get('add') ?? undefined)

  function startNew() {
    const workout = createCustomWorkout(adding ? { blocks: [newBlockFor(adding)] } : {})
    navigate(`/builder/${workout.id}`)
  }

  // Drop the drill in at the end, then go straight to its numbers. Appending puts it
  // at the index the list ends on today, so read that length before changing it.
  function addTo(workoutId: string) {
    if (!adding) return
    const index = mine.find((w) => w.id === workoutId)?.blocks.length ?? 0
    updateBlocks(workoutId, (blocks) => [...blocks, newBlockFor(adding)])
    navigate(`/builder/${workoutId}/block/${index}`)
  }

  return (
    <section>
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {adding ? 'Add to a session' : 'Your sessions'}
        </h1>
        <div className="chalk-line mt-2 w-20" aria-hidden="true" />
        <p className="mt-3 text-slate">
          {adding ? (
            <>
              Pick a session for <span className="font-semibold text-ink">{adding.name}</span>, or
              start a new one built around it.
            </>
          ) : mine.length === 0 ? (
            'Build a session of your own — pick drills, set the numbers, and the length works itself out.'
          ) : (
            `${mine.length} ${mine.length === 1 ? 'session' : 'sessions'} you built.`
          )}
        </p>
      </header>

      <button
        onClick={startNew}
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-pitch font-display text-lg font-extrabold text-white active:brightness-95"
      >
        <span aria-hidden="true">+</span>
        {adding ? 'New session with this drill' : 'New session'}
      </button>

      {mine.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate/30 p-6">
          <p className="font-display text-lg font-bold">Two ways to start</p>
          <ol className="mt-3 space-y-3 text-slate">
            <li className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-bold text-chalk">
                1
              </span>
              <span className="pt-0.5 leading-relaxed">
                From scratch — hit <span className="font-semibold text-ink">New session</span> and
                add drills from the library.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-bold text-chalk">
                2
              </span>
              <span className="pt-0.5 leading-relaxed">
                From one that already works — open any{' '}
                <Link to="/workouts" className="font-semibold text-pitch underline">
                  ready-made session
                </Link>{' '}
                and choose <span className="font-semibold text-ink">Make it mine</span>, then change
                whatever you like.
              </span>
            </li>
          </ol>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {mine.map((workout) => {
            const meta = workoutMeta(workout)
            const minutes = workout.blocks.length === 0 ? 0 : meta.minutes
            const body = (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-bold leading-tight text-ink">
                    <span className="mr-1.5 text-slate">{workout.code}</span>
                    {workout.name}
                  </p>
                  <p className="mt-0.5 text-sm text-slate">
                    {workout.blocks.length === 0 ? (
                      'Empty — no drills yet'
                    ) : (
                      <>
                        {workout.blocks.length} {workout.blocks.length === 1 ? 'drill' : 'drills'} ·{' '}
                        <span style={{ color: CATEGORY_ACCENT[workout.category] }}>
                          {CATEGORY_LABELS[workout.category]}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-2xl font-extrabold leading-none text-ink">{minutes}</p>
                  <p className="text-xs text-slate">min</p>
                </div>
              </>
            )

            return (
              <li key={workout.id}>
                {adding ? (
                  <button
                    onClick={() => addTo(workout.id)}
                    className="flex w-full items-center gap-3 card p-4 text-left active:bg-white"
                  >
                    {body}
                  </button>
                ) : (
                  <Link
                    to={`/builder/${workout.id}`}
                    className="flex items-center gap-3 card p-4 active:bg-white"
                  >
                    {body}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
