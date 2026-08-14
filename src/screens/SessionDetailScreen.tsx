import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteSession, useSession } from '../lib/sessions'
import { useWorkout } from '../lib/customWorkouts'
import CategoryBars from '../components/CategoryBars'
import StatTile from '../components/StatTile'
import NotFound from '../components/NotFound'

const EFFORT_LABELS = ['', 'Easy', 'Steady', 'Working', 'Hard', 'All-out']

/*
  One session you finished. A record, not a plan — everything here is what actually
  happened, kept as a snapshot so it survives the workout being edited or deleted
  afterwards.
*/
export default function SessionDetailScreen() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const session = useSession(sessionId)
  const [confirming, setConfirming] = useState(false)

  // May well be gone — the session is the record, the workout is just where it came from.
  const workout = useWorkout(session?.workoutId)

  if (!session) {
    return (
      <NotFound title="Session not found" to="/history" cta="Back to progress">
        It may have been deleted from your history.
      </NotFound>
    )
  }

  const when = new Date(session.completedAt)
  const remove = () => {
    deleteSession(session.id)
    navigate('/history')
  }

  return (
    <section>
      <button
        onClick={() => navigate('/history')}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate"
      >
        <span aria-hidden="true">←</span> Progress
      </button>

      <p className="text-xs font-semibold uppercase tracking-widest text-pitch">
        {when.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
        {when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{session.workoutName}</h1>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatTile value={session.totalMinutes} label="minutes" />
        <StatTile value={session.exercisesCompleted} label="drills done" />
        <StatTile value={session.exercisesSkipped} label="skipped" />
      </div>

      {session.perceivedEffort != null && (
        <p className="mt-4 text-slate">
          Effort:{' '}
          <span className="font-semibold text-ink">
            {session.perceivedEffort}/5 · {EFFORT_LABELS[session.perceivedEffort]}
          </span>
        </p>
      )}

      {Object.keys(session.categoryBreakdown).length > 0 && (
        <div className="mt-7">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate">
            Where the time went
          </h2>
          <div className="mt-3">
            <CategoryBars
              categorySeconds={Object.fromEntries(
                Object.entries(session.categoryBreakdown).map(([c, m]) => [c, m * 60]),
              )}
              totalMinutes={session.totalMinutes}
            />
          </div>
        </div>
      )}

      {session.notes && (
        <div className="mt-7">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate">Your note</h2>
          <p className="mt-2 rounded-xl bg-white/70 border border-slate/15 p-4 leading-relaxed">
            {session.notes}
          </p>
        </div>
      )}

      {workout ? (
        <Link
          to={`/workouts/${workout.id}`}
          className="mt-7 flex h-12 items-center justify-center rounded-xl border border-slate/20 bg-paper shadow-card font-semibold text-ink active:bg-white/70"
        >
          Do this session again
        </Link>
      ) : (
        <p className="mt-7 text-sm text-slate">
          The session this came from no longer exists, but your record of it stays here.
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-slate/15 p-4">
        {confirming ? (
          <>
            <p className="font-semibold text-ink">Remove this from your history?</p>
            <p className="mt-1 text-sm text-slate">
              It stops counting towards your totals and your streak.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={remove}
                className="h-11 flex-1 rounded-xl bg-blaze font-semibold text-white active:brightness-95"
              >
                Remove
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="h-11 flex-1 rounded-xl border border-slate/20 bg-paper shadow-card font-semibold text-ink"
              >
                Keep it
              </button>
            </div>
          </>
        ) : (
          <button onClick={() => setConfirming(true)} className="h-11 w-full text-sm font-semibold text-slate">
            Remove from history
          </button>
        )}
      </div>
    </section>
  )
}
