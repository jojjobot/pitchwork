import { useState } from 'react'
import { CloudError, isConfigured, restoreOnThisDevice } from '../lib/cloud'

/*
  "I already have an account on my other device" — the one that actually works.

  This has to live on the sign-in screen for the same reason the transfer-file
  import does: on a new phone there is no local profile yet, so Settings is behind a
  door you can't open. This is the only way in.

  Unlike the transfer file, this DOES sign you in. It can, because you just typed
  the password and the server checked it — so the local profile is made with that
  same password, and the phone still opens offline afterwards.
*/
export default function CloudRestore({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isConfigured()) return null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = await restoreOnThisDevice(email.trim(), password, remember)
      if (result.state === 'error') setError(result.message)
      else onDone()
    } catch (e) {
      setError(e instanceof CloudError ? e.message : 'That did not work.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card mt-6 p-4">
      <p className="text-sm font-semibold text-ink">Already training on another device?</p>
      <p className="mt-1 text-sm leading-relaxed text-slate">
        If you turned on syncing there, sign in with that email and everything — your history,
        your drills, your sessions, your challenge — arrives here.
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-3 h-11 w-full rounded-xl border border-slate/20 bg-paper font-semibold text-ink shadow-card active:bg-chalk"
        >
          Sign in and bring it over
        </button>
      ) : (
        <form onSubmit={submit} className="mt-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-xl border border-slate/20 bg-paper px-3.5 text-base text-ink"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-slate/20 bg-paper px-3.5 text-base text-ink"
          />
          <label className="mt-3 flex items-center gap-2.5 text-sm text-slate">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-5 w-5 accent-pitch"
            />
            Stay signed in on this device
          </label>
          <button
            type="submit"
            disabled={busy}
            className="mt-3 h-12 w-full rounded-xl bg-pitch font-display text-base font-extrabold text-white disabled:opacity-50"
          >
            {busy ? 'Bringing it over…' : 'Sign in and sync'}
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-sm font-medium text-blaze">{error}</p>}
    </div>
  )
}
