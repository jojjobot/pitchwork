import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useWorkout } from '../lib/customWorkouts'
import { buildSteps } from '../lib/workout'
import { formatKg } from '../lib/builder'
import { formatSeconds } from '../lib/format'
import { primeAudio, playTone, vibrate } from '../lib/audio'
import { useWakeLock } from '../lib/useWakeLock'
import { getSettings, updateSettings } from '../lib/settings'
import { recordSession } from '../lib/sessions'
import { CATEGORY_ACCENT, CATEGORY_LABELS } from '../lib/labels'
import PitchArt, { PitchBackdrop } from '../components/PitchArt'
import type { Category, CompletedSession } from '../types'

export default function SessionPlayer() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  // The player doesn't care whether this came from the programme or from your builder.
  const workout = useWorkout(workoutId)
  const steps = useMemo(() => (workout ? buildSteps(workout) : []), [workout])

  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'summary'>('playing')
  const [muted, setMuted] = useState(() => !getSettings().soundEnabled)

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

  const vibrationOn = getSettings().vibrationEnabled
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
      catSecondsRef.current[step.exercise.category] =
        (catSecondsRef.current[step.exercise.category] ?? 0) + step.estimateSeconds
      blocksDoneRef.current.add(step.blockIndex)
    }
    const ni = indexRef.current + 1
    indexRef.current = ni // sync immediately so a stray tick can't double-advance
    if (ni >= steps.length) setPhase('summary')
    else setIndex(ni)
  }

  function completeReps() {
    const step = steps[indexRef.current]
    if (step && step.kind === 'work') setElapsed((e) => e + step.estimateSeconds)
    cueEnd()
    advance(true)
  }

  function toggleMute() {
    setMuted((m) => {
      const nm = !m
      updateSettings({ soundEnabled: !nm }) // same switch as the one in Settings
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
          recordSession(session)
          navigate(`/history/${session.id}`)
        }}
        onDiscard={() => navigate('/')}
      />
    )
  }

  const step = steps[index]
  if (!step) return null
  const progress = steps.length ? (index / steps.length) * 100 : 0

  /*
    The room changes colour with the skill you're training. Working on shooting is
    orange-lit, defending is grey-green — so a glance at a phone propped on a bag
    tells you where you are without reading. Rest is always lime, so it reads as a
    different state rather than a different drill.
  */
  const accent = step.kind === 'work' ? CATEGORY_ACCENT[step.exercise.category] : '#d8e64a'

  return (
    <div
      className="relative min-h-[100svh] bg-deep text-chalk flex flex-col select-none"
      style={{
        backgroundImage: `radial-gradient(130% 75% at 50% -5%, color-mix(in oklab, ${accent} 40%, #0a1c14) 0%, #0a1c14 60%)`,
      }}
    >
      {/* The skill's diagram, ghosted behind everything. */}
      {step.kind === 'work' && (
        <div className="pointer-events-none fixed inset-0" aria-hidden="true">
          <PitchBackdrop category={step.exercise.category} opacity={0.07} />
        </div>
      )}

      {/* Top bar */}
      <header className="relative px-5 pt-4">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setPhase('summary')}
            className="rounded-xl border border-chalk/20 bg-chalk/5 px-3.5 h-10 text-sm font-semibold text-chalk/80 backdrop-blur active:bg-chalk/15"
          >
            End
          </button>
          <p className="min-w-0 truncate font-display text-sm font-bold text-chalk/70">{workout.name}</p>
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-chalk/20 bg-chalk/5 backdrop-blur active:bg-chalk/15"
          >
            {muted ? <MuteIcon /> : <SoundIcon />}
          </button>
        </div>

        {/* How far through the whole session you are, plus the count in words —
            "step 7 of 24" is the thing people actually want at minute thirty. */}
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-chalk/15">
            <div
              className="h-full rounded-full bg-lime transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-semibold text-chalk/50 tnum">
            {index + 1}/{steps.length}
          </span>
        </div>
      </header>

      {step.kind === 'work' ? (
        <WorkView step={step} remaining={remaining} paused={paused} />
      ) : (
        <RestView step={step} remaining={remaining} />
      )}

      {/* Controls */}
      <footer className="relative px-5 pb-8 pt-4" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        {step.kind === 'work' && step.seconds == null ? (
          // rep-based drill: a big Done button, plus skip
          <div className="flex items-center gap-3">
            <ControlButton onClick={() => advance(false)} variant="ghost">
              Skip
            </ControlButton>
            <button
              onClick={completeReps}
              className="h-15 flex-1 rounded-2xl bg-blaze font-display text-lg font-extrabold text-white shadow-glow transition-transform duration-200 active:scale-[0.985]"
            >
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
  const total = step.seconds
  const left = remaining ?? total ?? 0
  const ringProgress = total && total > 0 ? left / total : 1

  return (
    <main className="relative flex-1 overflow-y-auto px-5 py-4">
      <div className="flex items-center gap-2.5">
        <PitchArt category={ex.category} className="h-9 w-9 rounded-lg" />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-chalk/60">
            {CATEGORY_LABELS[ex.category]}
          </p>
          <p className="text-sm font-semibold text-chalk/80 tnum">
            Set {step.setIndex} of {step.setCount}
          </p>
        </div>
      </div>
      <h1 className="mt-2.5 font-display text-3xl font-extrabold leading-tight">{ex.name}</h1>

      {/*
        THE CLOCK. The ring is what makes this readable from three metres away with
        a ball at your feet — you can see a quarter left without reading digits.
      */}
      <div className="my-6">
        {total != null ? (
          <TimerRing progress={ringProgress} color={paused ? 'rgba(244,241,233,0.35)' : '#ff5a2c'}>
            <p
              className={[
                'font-display text-6xl font-extrabold tnum',
                paused ? 'text-chalk/40' : 'text-chalk',
                !paused && left <= 3 ? 'beat text-blaze' : '',
              ].join(' ')}
            >
              {formatSeconds(left)}
            </p>
            {paused ? (
              <p className="mt-1 text-sm font-bold uppercase tracking-widest text-chalk/60">Paused</p>
            ) : (
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-chalk/40">
                remaining
              </p>
            )}
          </TimerRing>
        ) : (
          // A rep drill is self-paced, so there's nothing to count down — the ring
          // would be a lie. The number just stands there and waits for you.
          <TimerRing progress={1} color="rgba(216,230,74,0.55)" dashed>
            <p className="font-display text-6xl font-extrabold text-chalk tnum">{step.reps}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-chalk/50">reps</p>
          </TimerRing>
        )}

        {/* Loaded drills only. Shown under the number rather than beside it, because
            the weight is the thing you have to go and set up before the set starts. */}
        {step.weightKg != null && (
          <p className="mt-3 text-center font-display text-2xl font-extrabold text-lime">
            {formatKg(step.weightKg)}
          </p>
        )}
      </div>

      {step.note && (
        <p className="mb-4 rounded-xl border border-lime/25 bg-lime/12 px-4 py-2.5 text-sm font-medium text-lime">
          {step.note}
        </p>
      )}

      {/* Instructions */}
      <ol className="space-y-2">
        {ex.instructions.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-chalk/15 text-xs font-bold tnum">
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed text-chalk/90">{s}</span>
          </li>
        ))}
      </ol>

      {/* Cues */}
      <div className="mt-5 rounded-2xl border border-chalk/15 bg-chalk/5 p-4 backdrop-blur">
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

/*
  The countdown ring. One SVG circle whose dash offset is the remaining fraction,
  rotated so it starts at twelve o'clock. The 1s linear transition matches the
  interval exactly, so it sweeps rather than stepping.
*/
function TimerRing({
  progress,
  color,
  dashed = false,
  children,
}: {
  progress: number
  color: string
  dashed?: boolean
  children: React.ReactNode
}) {
  const R = 86
  const C = 2 * Math.PI * R

  return (
    <div className="relative mx-auto grid h-60 w-60 place-items-center">
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(244,241,233,0.1)" strokeWidth="9" />
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={dashed ? '3 12' : C}
          strokeDashoffset={dashed ? 0 : C * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
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
  const left = remaining ?? step.seconds
  const progress = step.seconds > 0 ? left / step.seconds : 1

  return (
    <main className="relative flex-1 grid place-items-center px-5 py-4 text-center">
      <div className="w-full">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-lime">Rest</p>

        <div className="mt-4">
          <TimerRing progress={progress} color="#d8e64a">
            <p className="font-display text-6xl font-extrabold text-lime tnum">
              {formatSeconds(left)}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-chalk/40">
              breathe
            </p>
          </TimerRing>
        </div>

        {next && (
          <div className="mx-auto mt-6 flex max-w-xs items-center gap-3 rounded-2xl border border-chalk/15 bg-chalk/5 p-3.5 text-left backdrop-blur">
            <PitchArt category={next.category} className="h-12 w-12 rounded-xl" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-chalk/45">Coming up</p>
              <p className="mt-0.5 truncate font-display text-lg font-bold leading-tight">{next.name}</p>
              {step.nextSetCount != null && (
                <p className="text-sm text-chalk/60 tnum">
                  Set {step.nextSetIndex} of {step.nextSetCount}
                </p>
              )}
            </div>
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
  // Whatever you spent most of the session on becomes the picture behind the total.
  const topCategory = breakdown[0]?.category

  return (
    <div className="min-h-[100svh] bg-chalk text-ink flex flex-col">
      {/* The reward. Finishing a session deserves more than a heading, so the number
          you earned is the size of the screen before anything else is asked of you. */}
      <div className="panel-deep relative overflow-hidden px-5 pb-10 pt-12">
        {topCategory && <PitchBackdrop category={topCategory} opacity={0.18} />}
        <div className="relative mx-auto w-full max-w-md text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime">Session complete</p>
          <p className="mt-4 font-display text-7xl font-extrabold leading-none text-chalk tnum">
            {Math.max(1, Math.round(elapsed / 60))}
          </p>
          <p className="mt-1 font-display text-lg font-bold text-chalk/60">minutes trained</p>
          <div className="chalk-line mx-auto mt-4 w-16" aria-hidden="true" />
        </div>
      </div>

      <main className="mx-auto w-full max-w-md flex-1 px-5 py-7">
        {/* Headline stats */}
        <div className="grid grid-cols-2 gap-3 text-center">
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
            className="mt-2 w-full rounded-xl border border-slate/20 bg-paper shadow-card px-4 py-3 text-base outline-none focus:border-pitch"
          />
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <button
            onClick={() => onSave(effort, notes.trim() ? notes.trim() : null)}
            className="h-15 w-full rounded-2xl bg-blaze font-display text-lg font-extrabold text-white shadow-glow transition-transform duration-200 active:scale-[0.985]"
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
    <div className="card py-4">
      <p className="font-display text-3xl font-extrabold tnum">{value}</p>
      <p className="mt-1 text-xs text-slate">{label}</p>
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
