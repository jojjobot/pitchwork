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
    <div className="min-h-[100svh] bg-chalk px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <header>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">Pitchwork</h1>
          <div className="chalk-line mt-2 w-20" aria-hidden="true" />
          <p className="mt-4 text-slate">
            {creating
              ? firstRun
                ? 'Set up an account to keep your training under your own name.'
                : 'Add another account to this browser.'
              : 'Sign in to pick up where you left off.'}
          </p>
        </header>

        {inheriting && (
          <p className="mt-4 rounded-xl bg-lime/25 px-4 py-3 text-sm text-ink">
            The training already saved in this browser will be kept under this first account.
          </p>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
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
              className="mt-1 w-full rounded-xl border border-slate/25 bg-white px-4 h-12 text-base outline-none focus:border-pitch"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={creating ? 'new-password' : 'current-password'}
              className="mt-1 w-full rounded-xl border border-slate/25 bg-white px-4 h-12 text-base outline-none focus:border-pitch"
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
                className="mt-1 w-full rounded-xl border border-slate/25 bg-white px-4 h-12 text-base outline-none focus:border-pitch"
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
            className="flex w-full items-center gap-3 rounded-xl border border-slate/25 bg-white/70 p-3 text-left"
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
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-blaze font-display text-lg font-extrabold text-white active:brightness-95 disabled:opacity-60"
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

        {imported && (
          <p className="mt-4 rounded-xl bg-lime/25 px-4 py-3 text-sm text-ink">{imported}</p>
        )}

        {/* The bridge between devices. Quiet, because most people open this screen
            on a device that already has their account. */}
        <div className="mt-6 rounded-2xl border border-slate/15 p-4">
          <p className="text-sm font-semibold text-ink">Already have an account on another device?</p>
          <p className="mt-1 text-sm leading-relaxed text-slate">
            Accounts live in one browser, so signing in here won't find it. On that device open
            Settings → Move to another device, then open the saved file here.
          </p>
          <button
            onClick={() => transferInput.current?.click()}
            className="mt-3 h-11 w-full rounded-xl border border-slate/25 bg-white font-semibold text-ink active:bg-chalk"
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
        <div className="mt-8 rounded-2xl border border-slate/15 p-4 text-sm leading-relaxed text-slate">
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
