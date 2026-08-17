import { useRef, useState } from 'react'
import {
  AuthError,
  MIN_PASSWORD_LENGTH,
  accountCount,
  createAccount,
  emailProblem,
  hasUnclaimedData,
  passwordProblem,
  signIn,
} from '../lib/auth'
import { applyTransfer } from '../lib/transfer'
import { exercises } from '../data/exercises'
import { workouts } from '../data/workouts'
import PitchArt, { Mark, PitchBackdrop } from '../components/PitchArt'
import type { Category } from '../types'

// What's actually in the box, counted rather than claimed — the numbers move on
// their own if the library grows, so the front door can never overstate it.
const SHOWCASE: Category[] = ['dribbling', 'shooting', 'passing', 'first-touch']

/*
  The front door. Two modes on one screen — signing in and creating an account —
  because on a phone a second screen for four fields is a step for nothing.

  The copy here is deliberately plain about what this does and doesn't do. An app
  that says "secure" while keeping plain JSON in localStorage is teaching the user
  something false about their own data.
*/
export default function SignInScreen() {
  const firstRun = accountCount() === 0
  const [mode, setMode] = useState<'signIn' | 'create'>(firstRun ? 'create' : 'signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imported, setImported] = useState<string | null>(null)
  const transferInput = useRef<HTMLInputElement>(null)

  const creating = mode === 'create'
  const inheriting = creating && hasUnclaimedData()

  /*
    Bringing an account over from another device. This has to live on the sign-in
    screen rather than in Settings: on a new phone there is no account to sign into
    yet, so Settings is unreachable — this is the only door.

    It never signs anyone in. The file carries no usable password, so you sign in
    afterwards exactly as you would have.
  */
  async function importTransfer(file: File) {
    try {
      const result = applyTransfer(JSON.parse(await file.text()))
      setEmail(result.email)
      setMode('signIn')
      setError(null)
      setImported(
        [
          result.created
            ? `${result.email} is now on this device.`
            : `${result.email} was already here.`,
          result.sessionsAdded > 0 &&
            `${result.sessionsAdded} ${result.sessionsAdded === 1 ? 'session' : 'sessions'} added.`,
          result.workoutsAdded > 0 &&
            `${result.workoutsAdded} built ${result.workoutsAdded === 1 ? 'session' : 'sessions'} added.`,
          result.exercisesAdded > 0 &&
            `${result.exercisesAdded} ${result.exercisesAdded === 1 ? 'drill' : 'drills'} you wrote added.`,
          result.challengesAdded > 0 &&
            `${result.challengesAdded} ${result.challengesAdded === 1 ? 'challenge' : 'challenges'} added.`,
          'Sign in with the same password.',
        ]
          .filter(Boolean)
          .join(' '),
      )
    } catch (err) {
      setImported(null)
      setError(
        err instanceof Error && err.message
          ? err.message
          : "That file couldn't be read as a Pitchwork transfer.",
      )
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return

    const problem =
      emailProblem(email) ??
      passwordProblem(password) ??
      (creating && password !== confirm ? "Those passwords don't match." : null)
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    setError(null)
    try {
      if (creating) await createAccount(email, password, remember)
      else await signIn(email, password, remember)
      // On success the whole app re-renders behind this screen — nothing to do here.
    } catch (err) {
      setError(
        err instanceof AuthError || err instanceof Error
          ? err.message
          : 'Something went wrong signing in.',
      )
      setBusy(false)
    }
  }

  function switchMode() {
    setMode(creating ? 'signIn' : 'create')
    setError(null)
    setConfirm('')
  }

  return (
    <div className="min-h-[100svh] bg-chalk pb-12">
      {/*
        THE FRONT DOOR.

        On a public release this is the only screen a stranger sees before deciding
        whether the app is worth an account, so it does the job a landing page would:
        says what Pitchwork is, shows what's inside, and counts the library honestly.
      */}
      <header className="panel-deep relative overflow-hidden px-5 pb-14 pt-12">
        <PitchBackdrop category="shooting" opacity={0.18} />

        <div className="relative mx-auto w-full max-w-md">
          <div className="flex items-center gap-3">
            <Mark size={44} />
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-chalk">
              Pitchwork
            </h1>
          </div>
          <div className="chalk-line mt-3 w-24" aria-hidden="true" />

          <p className="mt-5 font-display text-xl font-bold leading-snug text-chalk">
            Train alone. Play sharper.
          </p>
          <p className="mt-2 leading-relaxed text-chalk/65">
            A drill library and guided sessions for the training you do on your own — with a
            timer that runs the session for you and a record of everything you've done.
          </p>

          {/* A look at the material, before being asked for anything. */}
          <div className="mt-6 flex gap-2">
            {SHOWCASE.map((cat) => (
              <PitchArt key={cat} category={cat} className="h-16 flex-1 rounded-xl" />
            ))}
          </div>

          <p className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-semibold text-chalk/70">
            <span className="tnum text-lime">{exercises.length}</span> drills
            <span aria-hidden="true" className="text-chalk/30">·</span>
            <span className="tnum text-lime">{workouts.length}</span> ready-made sessions
            <span aria-hidden="true" className="text-chalk/30">·</span>
            <span>works offline</span>
          </p>
        </div>
      </header>

      {/* `relative` is load-bearing: the header above is a positioned element, so
          without a stacking context here it paints over the top of this card and
          shears off the heading. */}
      <div className="relative mx-auto -mt-8 w-full max-w-md px-5">
        <div className="card p-5 shadow-lift">
          <h2 className="font-display text-xl font-bold text-ink">
            {creating ? (firstRun ? 'Create your account' : 'Add an account') : 'Welcome back'}
          </h2>
          <p className="mt-1 text-sm text-slate">
            {creating
              ? firstRun
                ? 'Set up an account to keep your training under your own name.'
                : 'Add another account to this browser.'
              : 'Sign in to pick up where you left off.'}
          </p>

          {inheriting && (
            <p className="mt-4 rounded-xl bg-lime/25 px-4 py-3 text-sm text-ink">
              The training already saved in this browser will be kept under this first account.
            </p>
          )}

          <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border border-slate/20 bg-paper shadow-card px-4 h-12 text-base outline-none focus:border-pitch"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={creating ? 'new-password' : 'current-password'}
              className="mt-1 w-full rounded-xl border border-slate/20 bg-paper shadow-card px-4 h-12 text-base outline-none focus:border-pitch"
            />
            {creating && (
              <span className="mt-1 block text-xs text-slate">
                At least {MIN_PASSWORD_LENGTH} characters.
              </span>
            )}
          </label>

          {creating && (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate">
                Password again
              </span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="mt-1 w-full rounded-xl border border-slate/20 bg-paper shadow-card px-4 h-12 text-base outline-none focus:border-pitch"
              />
            </label>
          )}

          {/* The remember-me switch: the whole difference is which storage the
              signed-in marker goes into, so the wording says exactly that. */}
          <button
            type="button"
            role="switch"
            aria-checked={remember}
            onClick={() => setRemember((v) => !v)}
            className="flex w-full items-center gap-3 rounded-xl border border-slate/20 bg-paper shadow-card/70 p-3 text-left"
          >
            <span
              className={[
                'grid h-6 w-6 shrink-0 place-items-center rounded-md border-2',
                remember ? 'border-pitch bg-pitch text-white' : 'border-slate/40 bg-white',
              ].join(' ')}
              aria-hidden="true"
            >
              {remember && '✓'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">Remember me</span>
              <span className="block text-xs text-slate">
                {remember
                  ? 'Stay signed in on this device until you sign out.'
                  : 'Sign out automatically when you close the browser.'}
              </span>
            </span>
          </button>

          {error && (
            <p role="alert" className="rounded-xl bg-blaze/15 px-4 py-3 text-sm font-medium text-ink">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-blaze font-display text-lg font-extrabold text-white shadow-glow transition-transform duration-200 active:scale-[0.985] disabled:opacity-60"
          >
            {busy ? 'One moment…' : creating ? 'Create account' : 'Sign in'}
          </button>
          </form>

          {/* On a brand-new browser there is nothing to sign in to, so this stays hidden */}
          {(!creating || accountCount() > 0) && (
            <button onClick={switchMode} className="mt-4 h-11 w-full text-sm font-semibold text-pitch">
              {creating ? 'I already have an account' : 'Create an account'}
            </button>
          )}
        </div>

        {imported && (
          <p className="mt-4 rounded-xl bg-lime/25 px-4 py-3 text-sm text-ink">{imported}</p>
        )}

        {/* The bridge between devices. Quiet, because most people open this screen
            on a device that already has their account. */}
        <div className="card mt-6 p-4">
          <p className="text-sm font-semibold text-ink">Already have an account on another device?</p>
          <p className="mt-1 text-sm leading-relaxed text-slate">
            Accounts live in one browser, so signing in here won't find it. On that device open
            Settings → Move to another device, then open the saved file here.
          </p>
          <button
            onClick={() => transferInput.current?.click()}
            className="mt-3 h-11 w-full rounded-xl border border-slate/20 bg-paper shadow-card font-semibold text-ink active:bg-chalk"
          >
            Open a transfer file
          </button>
          <input
            ref={transferInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) importTransfer(file)
              e.target.value = '' // let the same file be picked twice
            }}
          />
        </div>

        {/* What this actually protects. Said once, plainly, where it matters. */}
        <div className="mt-6 rounded-2xl border border-dashed border-slate/30 p-4 text-sm leading-relaxed text-slate">
          <p className="font-semibold text-ink">Worth knowing</p>
          <p className="mt-2">
            Pitchwork has no server. Your account and your training live in this browser only, so
            there's no email to verify and{' '}
            <span className="font-semibold text-ink">no way to reset a forgotten password</span> —
            write it down somewhere.
          </p>
          <p className="mt-2">
            This is a lock on the front door, not a safe. It keeps other people out of your
            training, but it doesn't encrypt it.
          </p>
        </div>
      </div>
    </div>
  )
}
