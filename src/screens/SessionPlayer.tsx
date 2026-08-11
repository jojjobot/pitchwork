import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { workoutById } from '../data/workouts'
import { buildSteps } from '../lib/workout'
import { formatSeconds } from '../lib/format'
import { primeAudio, playTone, vibrate } from '../lib/audio'
import { useWakeLock } from '../lib/useWakeLock'
import { loadSettings, saveSettings, saveSession } from '../lib/storage'
import { CATEGORY_ACCENT, CATEGORY_LABELS } from '../lib/labels'
import type { Category, CompletedSession } from '../types'

export default function SessionPlayer() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  const workout = workoutId ? workoutById[workoutId] : undefined
  const steps = useMemo(() => (workout ? buildSteps(workout) : []), [workout])

  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'summary'>('playing')
  const [muted, setMuted] = useState(() => !loadSettings().soundEnabled)

  // Accumulators for the summary. Refs so the interval always reads fresh values.
  const catSecondsRef = useRef<Record<string, number>>({})
  const blocksDoneRef = useRef<Set<number>>(new Set())

  // Mirror state into refs for the 1-second interval.
  const indexRef = useRef(index)
  const remainingRef = useRef(remaining)
  const pausedRef = useRef(paused)
  const mutedRef = useRef(muted)
  useEffect(() => void (indexRef.current = index), [index])
  useEffect(() => void (remainingRef.current = remaining), [remaining])
  useEffect(() => void (pausedRef.current = paused), [paused])
  useEffect(() => void (mutedRef.current = muted), [muted])

  useWakeLock(phase === 'playing')
  useEffect(() => primeAudio(), []) // allow sound after the Start tap

  const vibrationOn = loadSettings().vibrationEnabled
  const tone = (f: number, d: number) => !mutedRef.current && playTone(f, d)
  const buzz = (p: number | number[]) => !mutedRef.current && vibrationOn && vibrate(p)
  const cueStart = () => {
    tone(880, 150)
    buzz(60)
  }
  const cueRest = () => {
    tone(500, 180)
    buzz([40, 40, 40])
  }
  const cueTick = () => {
    tone(660, 90)
    buzz(20)
  }
  const cueEnd = () => {
    tone(990, 220)
    buzz([80, 40, 80])
  }

  // On entering a step, set its timer and play the right cue.
  useEffect(() => {
    if (phase !== 'playing') return
    const step = steps[index]
    if (!step) {
      setPhase('summary')
      return
    }
    if (step.kind === 'work') {
      setRemaining(step.seconds)
      if (step.seconds != null) cueStart()
    } else {
      setRemaining(step.seconds)
      cueRest()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, phase])

  // The heartbeat: one tick per second while playing and not paused.
  useEffect(() => {
    if (phase !== 'playing') return
    const id = setInterval(() => {
      if (pausedRef.current) return
      const step = steps[indexRef.current]
      if (!step) return
      if (step.kind === 'work' && step.seconds == null) return // rep drill: self-paced
      setElapsed((e) => e + 1)
      const r = remainingRef.current
      if (r == null) return
      const next = r - 1
      if (next === 3 || next === 2 || next === 1) cueTick()
      if (next <= 0) {
        cueEnd()
        advance(true)
      } else {
        setRemaining(next)
      }
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, steps])

  function advance(completed: boolean) {
    const step = steps[indexRef.current]
    if (step && step.kind === 'work' && completed) {
      const secs = step.seconds ?? step.exercise.defaultDuration
      catSecondsRef.current[step.exercise.category] =
        (catSecondsRef.current[step.exercise.category] ?? 0) + secs
      blocksDoneRef.current.add(step.blockIndex)
    }
    const ni = indexRef.current + 1
    indexRef.current = ni // sync immediately so a stray tick can't double-advance
    if (ni >= steps.length) setPhase('summary')
    else setIndex(ni)
  }

  function completeReps() {
    const step = steps[indexRef.current]
    if (step && step.kind === 'work') setElapsed((e) => e + step.exercise.defaultDuration)
    cueEnd()
    advance(true)
  }

  function toggleMute() {
    setMuted((m) => {
      const nm = !m
      const s = loadSettings()
      saveSettings({ ...s, soundEnabled: !nm })
      return nm
    })
  }

  if (!workout) {
    return (
      <div className="min-h-[100svh] grid place-items-center bg-ink text-chalk p-6 text-center">
        <div>
          <p className="font-display text-2xl font-bold">Workout not found</p>
          <Link to="/workouts" className="mt-6 inline-block rounded-xl bg-chalk px-4 h-11 leading-[44px] font-semibold text-ink">
            Back to workouts
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'summary') {
    return (
      <SessionSummary
        elapsed={elapsed}
        completed={blocksDoneRef.current.size}
        skipped={Math.max(0, workout.blocks.length - blocksDoneRef.current.size)}
        categorySeconds={catSecondsRef.current}
        onSave={(effort, notes) => {
          const categoryBreakdown: Partial<Record<Category, number>> = {}
          for (const [k, v] of Object.entries(catSecondsRef.current)) {
            categoryBreakdown[k as Category] = Math.max(1, Math.round(v / 60))
          }
          const session: CompletedSession = {
            id: crypto.randomUUID(),
            workoutId: workout.id,
            workoutName: workout.name,
            completedAt: new Date().toISOString(),
            totalMinutes: Math.max(1, Math.round(elapsed / 60)),
            exercisesCompleted: blocksDoneRef.current.size,
            exercisesSkipped: Math.max(0, workout.blocks.length - blocksDoneRef.current.size),
            categoryBreakdown,
            perceivedEffort: effort,
            notes,
          }
          saveSession(session)
          navigate('/history')
        }}
        onDiscard={() => navigate('/')}
      />
    )
  }

  const step = steps[index]
  if (!step) return null
  const progress = steps.length ? (index / steps.length) * 100 : 0

  return (
    <div className="min-h-[100svh] bg-ink text-chalk flex flex-col select-none">
      {/* Top bar */}
      <header className="px-5 pt-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setPhase('summary')} className="rounded-lg px-3 h-10 text-sm font-semibold text-chalk/80 border border-chalk/20">
            End
          </button>
          <p className="font-display text-sm font-bold text-chalk/70">{workout.name}</p>
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="grid h-10 w-10 place-items-center rounded-lg border border-chalk/20"
          >
            {muted ? <MuteIcon /> : <SoundIcon />}
          </button>
        </div>
        <div className="mt-3 h-1 rounded-full bg-chalk/15">
          <div className="h-full rounded-full bg-lime transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {step.kind === 'work' ? (
        <WorkView step={step} remaining={remaining} paused={paused} />
      ) : (
        <RestView step={step} remaining={remaining} />
      )}

      {/* Controls */}
      <footer className="px-5 pb-8 pt-4" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        {step.kind === 'work' && step.seconds == null ? (
          // rep-based drill: a big Done button, plus skip
          <div className="flex items-center gap-3">
            <ControlButton onClick={() => advance(false)} variant="ghost">
              Skip
            </ControlButton>
            <button onClick={completeReps} className="h-14 flex-1 rounded-2xl bg-blaze font-display text-lg font-extrabold text-white active:brightness-95">
              Done
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <ControlButton onClick={() => setPaused((p) => !p)} variant="solid">
              {paused ? 'Resume' : 'Pause'}
            </ControlButton>
            <ControlButton onClick={() => setRemaining((r) => (r == null ? r : r + 30))} variant="ghost">
              +30s
            </ControlButton>
            <ControlButton onClick={() => advance(step.kind === 'work')} variant="ghost">
              Skip
            </ControlButton>
          </div>
        )}
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------ sub-views */

function WorkView({
  step,
  remaining,
  paused,
}: {
  step: Extract<ReturnType<typeof buildSteps>[number], { kind: 'work' }>
  remaining: number | null
  paused: boolean
}) {
  const ex = step.exercise
  return (
    <main className="flex-1 overflow-y-auto px-5 py-4">
      <p className="text-sm font-bold uppercase tracking-widest" style={{ color: CATEGORY_ACCENT[ex.category] }}>
        {CATEGORY_LABELS[ex.category]}
      </p>
      <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight">{ex.name}</h1>
      <p className="mt-1 font-semibold text-chalk/70">
        Set {step.setIndex} of {step.setCount}
      </p>

      {/* The big number */}
      <div className="my-6 text-center">
        {step.seconds != null ? (
          <p className={`font-display text-8xl font-extrabold tabular-nums ${paused ? 'text-chalk/40' : 'text-blaze'}`}>
            {formatSeconds(remaining ?? step.seconds)}
          </p>
        ) : (
          <p className="font-display text-7xl font-extrabold text-blaze">
            {step.reps}
            <span className="ml-2 text-2xl font-bold text-chalk/60">reps</span>
          </p>
        )}
        {paused && <p className="mt-1 font-semibold text-chalk/60">Paused</p>}
      </div>

      {step.note && (
        <p className="mb-4 rounded-xl bg-lime/15 px-4 py-2 text-sm font-medium text-lime">{step.note}</p>
      )}

      {/* Instructions */}
      <ol className="space-y-2">
        {ex.instructions.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-chalk/15 text-xs font-bold">{i + 1}</span>
            <span className="text-sm leading-relaxed text-chalk/90">{s}</span>
          </li>
        ))}
      </ol>

      {/* Cues */}
      <div className="mt-5 rounded-2xl border border-chalk/15 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-lime">Coaching cues</p>
        <ul className="mt-2 space-y-1.5">
          {ex.coachingCues.map((c, i) => (
            <li key={i} className="flex gap-2 text-sm text-chalk/90">
              <span className="text-lime" aria-hidden="true">✓</span>
              {c}
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

function RestView({
  step,
  remaining,
}: {
  step: Extract<ReturnType<typeof buildSteps>[number], { kind: 'rest' }>
  remaining: number | null
}) {
  const next = step.nextExercise
  return (
    <main className="flex-1 grid place-items-center px-5 py-4 text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-lime">Rest</p>
        <p className="my-4 font-display text-8xl font-extrabold tabular-nums text-lime">
          {formatSeconds(remaining ?? step.seconds)}
        </p>
        {next && (
          <div className="mx-auto max-w-xs rounded-2xl border border-chalk/15 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-chalk/50">Coming up</p>
            <p className="mt-1 font-display text-xl font-bold">{next.name}</p>
            {step.nextSetCount != null && (
              <p className="text-sm text-chalk/60">
                Set {step.nextSetIndex} of {step.nextSetCount}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

/* ---------------------------------------------------------------------- summary */

function SessionSummary({
  elapsed,
  completed,
  skipped,
  categorySeconds,
  onSave,
  onDiscard,
}: {
  elapsed: number
  completed: number
  skipped: number
  categorySeconds: Record<string, number>
  onSave: (effort: 1 | 2 | 3 | 4 | 5 | null, notes: string | null) => void
  onDiscard: () => void
}) {
  const [effort, setEffort] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [notes, setNotes] = useState('')

  const breakdown = (Object.entries(categorySeconds) as [Category, number][])
    .map(([category, secs]) => ({ category, minutes: Math.max(1, Math.round(secs / 60)) }))
    .sort((a, b) => b.minutes - a.minutes)
  const totalCatMinutes = breakdown.reduce((sum, b) => sum + b.minutes, 0) || 1

  return (
    <div className="min-h-[100svh] bg-chalk text-ink flex flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-pitch">Session complete</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Nice work.</h1>
        <div className="chalk-line mt-2 w-20" aria-hidden="true" />

        {/* Headline stats */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <Stat value={Math.max(1, Math.round(elapsed / 60))} label="minutes" />
          <Stat value={completed} label="drills done" />
          <Stat value={skipped} label="skipped" />
        </div>

        {/* Category breakdown */}
        {breakdown.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate">Where the time went</h2>
            <div className="mt-3 space-y-2">
              {breakdown.map(({ category, minutes }) => (
                <div key={category} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm font-medium">{CATEGORY_LABELS[category]}</span>
                  <div className="h-2.5 flex-1 rounded-full bg-slate/15">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(minutes / totalCatMinutes) * 100}%`, backgroundColor: CATEGORY_ACCENT[category] }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-sm text-slate">{minutes}m</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Effort */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate">How hard was that?</h2>
          <div className="mt-3 flex gap-2">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                onClick={() => setEffort(n)}
                className={[
                  'h-12 flex-1 rounded-xl font-display text-lg font-bold border',
                  effort === n ? 'bg-ink text-chalk border-ink' : 'bg-white text-ink border-slate/25',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-slate">
            <span>Easy</span>
            <span>All-out</span>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-6">
          <label htmlFor="notes" className="text-sm font-semibold uppercase tracking-wider text-slate">
            Note (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="How did it feel? Anything to remember?"
            className="mt-2 w-full rounded-xl border border-slate/25 bg-white px-4 py-3 text-base outline-none focus:border-pitch"
          />
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <button
            onClick={() => onSave(effort, notes.trim() ? notes.trim() : null)}
            className="h-14 w-full rounded-2xl bg-blaze font-display text-lg font-extrabold text-white active:brightness-95"
          >
            Save to history
          </button>
          <button onClick={onDiscard} className="h-11 w-full rounded-xl font-semibold text-slate">
            Discard
          </button>
        </div>
      </main>
    </div>
  )
}

/* --------------------------------------------------------------------- bits */

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-slate/15 bg-white/70 py-4">
      <p className="font-display text-3xl font-extrabold">{value}</p>
      <p className="text-xs text-slate">{label}</p>
    </div>
  )
}

function ControlButton({
  onClick,
  children,
  variant,
}: {
  onClick: () => void
  children: React.ReactNode
  variant: 'solid' | 'ghost'
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'h-14 rounded-2xl font-display text-base font-bold active:brightness-95',
        variant === 'solid' ? 'bg-chalk text-ink' : 'border border-chalk/25 text-chalk',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function SoundIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M17 8a5 5 0 0 1 0 8" />
    </svg>
  )
}
function MuteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M22 9l-6 6M16 9l6 6" />
    </svg>
  )
}
