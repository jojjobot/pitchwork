import { useState } from 'react'
import {
  CloudError,
  cloudSignOut,
  enableSyncHere,
  isConfigured,
  sendPasswordReset,
  sync,
  useCloudUser,
  useSyncStatus,
} from '../lib/cloud'

/*
  Turning on the thing that makes your phone and your laptop the same account.

  It lives in Settings rather than at the front door on purpose: the app is
  local-first and an account is opt-in, so nothing here is ever in the way of
  training. The mirror image of this — signing in on a device that has nothing yet —
  is on the sign-in screen, because that is the only door reachable before you're in.
*/
export default function CloudSync() {
  const user = useCloudUser()
  const status = useSyncStatus()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-up')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  if (!isConfigured()) {
    return (
      <div className="mt-2 card p-4">
        <p className="text-sm leading-relaxed text-slate">
          Syncing between devices isn't switched on in this build. Everything still works —
          your training is kept in this browser, and "Another device" below moves it by file.
        </p>
      </div>
    )
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setNote(null)
    try {
      const result = await enableSyncHere(email.trim(), password, mode)
      if (result.state === 'error') setError(result.message)
      else setNote('Synced. Sign in with the same email on your other device.')
      setPassword('')
    } catch (e) {
      setError(e instanceof CloudError ? e.message : 'That did not work.')
    } finally {
      setBusy(false)
    }
  }

  if (user) {
    return (
      <div className="mt-2 card p-4">
        <p className="text-sm leading-relaxed text-slate">
          Syncing as <span className="font-semibold text-ink">{user.email}</span>. Your history,
          your drills, your sessions and your challenges are on every device you sign in to with
          this email.
        </p>
        <p className="mt-2 text-sm text-slate">{describe(status)}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => void sync()}
            disabled={status.state === 'syncing'}
            className="h-11 rounded-xl border border-slate/20 bg-paper font-semibold text-ink shadow-card disabled:opacity-40"
          >
            {status.state === 'syncing' ? 'Syncing…' : 'Sync now'}
          </button>
          <button
            onClick={() => void cloudSignOut()}
            className="h-11 rounded-xl border border-slate/20 bg-paper font-semibold text-slate shadow-card"
          >
            Stop syncing
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate">
          Stopping leaves everything on this device exactly as it is. It only stops the copying.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-2 card p-4">
      <p className="text-sm leading-relaxed text-slate">
        {mode === 'sign-up'
          ? 'Make one account that works on every device. Your training on this device is uploaded first, so nothing is lost — then sign in with the same email on your phone and it will be there.'
          : 'Sign in and this device joins that account. Nothing here is replaced: the two histories are merged.'}
      </p>

      <form onSubmit={submit} className="mt-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-xl border border-slate/20 bg-paper px-3.5 text-base font-normal normal-case tracking-normal text-ink"
            placeholder="you@example.com"
          />
        </label>

        <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-slate">
          Password
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-xl border border-slate/20 bg-paper px-3.5 text-base font-normal normal-case tracking-normal text-ink"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="mt-4 h-12 w-full rounded-xl bg-pitch font-display text-base font-extrabold text-white disabled:opacity-50"
        >
          {busy ? 'Working…' : mode === 'sign-up' ? 'Turn on syncing' : 'Sign in and sync'}
        </button>
      </form>

      {error && <p className="mt-3 text-sm font-medium text-blaze">{error}</p>}
      {note && <p className="mt-3 text-sm font-medium text-pitch">{note}</p>}

      <button
        onClick={() => {
          setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')
          setError(null)
          setNote(null)
        }}
        className="mt-3 h-10 w-full text-sm font-semibold text-pitch"
      >
        {mode === 'sign-up' ? 'I already set this up' : 'Set it up for the first time'}
      </button>

      {mode === 'sign-in' && (
        <button
          onClick={async () => {
            if (!email.trim()) {
              setError('Put your email in first.')
              return
            }
            try {
              await sendPasswordReset(email.trim())
              setNote('Check your email for a reset link.')
            } catch (e) {
              setError(e instanceof CloudError ? e.message : 'That did not work.')
            }
          }}
          className="h-10 w-full text-sm font-medium text-slate"
        >
          Forgot your password?
        </button>
      )}

      <p className="mt-3 text-xs leading-relaxed text-slate">
        This is the one part of Pitchwork that leaves your device: your training is copied to a
        server so your other devices can read it. The app keeps working offline and signed out
        either way.
      </p>
    </div>
  )
}

function describe(status: ReturnType<typeof useSyncStatus>): string {
  if (status.state === 'syncing') return 'Syncing…'
  if (status.state === 'error') return status.message ?? 'Last sync failed.'
  if (status.at) {
    return `Last synced ${new Date(status.at).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })}.`
  }
  return 'Syncs on its own when you open the app and after you train.'
}
