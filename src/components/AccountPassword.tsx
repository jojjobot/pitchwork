import { useState } from 'react'
import { AuthError, MIN_PASSWORD_LENGTH, changePassword, passwordProblem } from '../lib/auth'

/*
  Changing your password, tucked behind a link because it's rare. Kept out of
  SettingsScreen so that screen stays a list of settings rather than a form.
*/
export default function AccountPassword({ onDone }: { onDone: (message: string) => void }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function close() {
    setOpen(false)
    setCurrent('')
    setNext('')
    setConfirm('')
    setError(null)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return

    const problem =
      passwordProblem(next) ?? (next !== confirm ? "Those new passwords don't match." : null)
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await changePassword(current, next)
      close()
      onDone('Password changed.')
    } catch (err) {
      setError(err instanceof AuthError || err instanceof Error ? err.message : 'That did not work.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-2 h-11 w-full text-sm font-semibold text-pitch">
        Change password
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 border-t border-slate/15 pt-4">
      <Field label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
      <Field label="New password" value={next} onChange={setNext} autoComplete="new-password" />
      <Field label="New password again" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      <p className="text-xs text-slate">
        At least {MIN_PASSWORD_LENGTH} characters. There's still no way to reset it if you forget.
      </p>

      {error && (
        <p role="alert" className="rounded-xl bg-blaze/15 px-4 py-2 text-sm font-medium text-ink">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="h-11 flex-1 rounded-xl bg-ink font-semibold text-chalk disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save password'}
        </button>
        <button
          type="button"
          onClick={close}
          className="h-11 flex-1 rounded-xl border border-slate/20 bg-paper shadow-card font-semibold text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-xl border border-slate/20 bg-paper shadow-card px-4 h-12 outline-none focus:border-pitch"
      />
    </label>
  )
}
