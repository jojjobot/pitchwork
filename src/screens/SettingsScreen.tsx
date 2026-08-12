import { useRef, useState } from 'react'
import { clearSessions, getSessions, replaceSessions, useSessions } from '../lib/sessions'
import { updateSettings, useSettings } from '../lib/settings'
import { useCustomWorkouts } from '../lib/customWorkouts'
import Stepper from '../components/Stepper'
import type { CompletedSession } from '../types'

/*
  Preferences, and the honest truth about where your data lives. Everything in
  Pitchwork is kept in this browser and nowhere else — no account, no server — so
  the backup buttons aren't a power-user feature, they're the only copy you can keep.
*/
export default function SettingsScreen() {
  const settings = useSettings()
  const sessions = useSessions()
  const mine = useCustomWorkouts()
  const fileInput = useRef<HTMLInputElement>(null)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function exportBackup() {
    const backup = { exportedAt: new Date().toISOString(), sessions: getSessions() }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `pitchwork-history-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage(`Saved ${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'} to your downloads.`)
  }

  async function importBackup(file: File) {
    try {
      const parsed = JSON.parse(await file.text())
      const incoming: CompletedSession[] = Array.isArray(parsed) ? parsed : parsed.sessions
      if (!Array.isArray(incoming)) throw new Error('not a backup')

      // Merge rather than overwrite, so restoring an old backup can't erase newer
      // sessions. Ids are unique per session, so they're the natural key.
      const byId = new Map(getSessions().map((s) => [s.id, s]))
      let added = 0
      for (const s of incoming) {
        if (s && typeof s.id === 'string' && !byId.has(s.id)) {
          byId.set(s.id, s)
          added++
        }
      }
      const merged = [...byId.values()].sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      )
      replaceSessions(merged)
      setMessage(
        added === 0
          ? 'Nothing new in that file — your history already has all of it.'
          : `Added ${added} ${added === 1 ? 'session' : 'sessions'} to your history.`,
      )
    } catch {
      setMessage("That file doesn't look like a Pitchwork backup.")
    }
  }

  return (
    <section>
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <div className="chalk-line mt-2 w-20" aria-hidden="true" />
      </header>

      {/* During a session */}
      <div className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">During a session</h2>
        <div className="mt-2 divide-y divide-slate/15 rounded-2xl border border-slate/15 bg-white/70">
          <Toggle
            label="Sound"
            hint="A tone on every start, rest and countdown."
            checked={settings.soundEnabled}
            onChange={(soundEnabled) => updateSettings({ soundEnabled })}
          />
          <Toggle
            label="Vibration"
            hint="Buzzes with the cues, for when it's loud or your phone's in a pocket."
            checked={settings.vibrationEnabled}
            onChange={(vibrationEnabled) => updateSettings({ vibrationEnabled })}
          />
        </div>
        <p className="mt-2 text-xs text-slate">
          The mute button in the player changes the sound setting too — they're the same switch.
        </p>
      </div>

      {/* Weekly goal */}
      <div className="mt-7">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">Weekly goal</h2>
        <div className="mt-2 rounded-2xl border border-slate/15 bg-white/70 p-4">
          <Stepper
            label="Minutes per week"
            value={settings.weeklyGoalMinutes}
            min={0}
            max={900}
            step={15}
            format={(v) => (v === 0 ? 'No goal' : `${v} min`)}
            onChange={(weeklyGoalMinutes) => updateSettings({ weeklyGoalMinutes })}
            hint={goalHint(settings.weeklyGoalMinutes)}
          />
        </div>
      </div>

      {/* Data */}
      <div className="mt-7">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">Your data</h2>
        <div className="mt-2 rounded-2xl border border-slate/15 bg-white/70 p-4">
          <p className="text-sm leading-relaxed text-slate">
            {sessions.length} saved {sessions.length === 1 ? 'session' : 'sessions'} and {mine.length}{' '}
            {mine.length === 1 ? 'session you built' : 'sessions you built'}, kept in this browser
            only. Clearing your browsing data clears them too.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={exportBackup}
              disabled={sessions.length === 0}
              className="h-11 rounded-xl border border-slate/25 bg-white font-semibold text-ink disabled:opacity-40"
            >
              Back up
            </button>
            <button
              onClick={() => fileInput.current?.click()}
              className="h-11 rounded-xl border border-slate/25 bg-white font-semibold text-ink"
            >
              Restore
            </button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) importBackup(file)
              e.target.value = '' // let the same file be picked twice
            }}
          />

          {message && <p className="mt-3 text-sm font-medium text-pitch">{message}</p>}
        </div>
      </div>

      {/* Clearing */}
      <div className="mt-4 rounded-2xl border border-slate/15 p-4">
        {confirmingClear ? (
          <>
            <p className="font-semibold text-ink">Clear your whole training history?</p>
            <p className="mt-1 text-sm text-slate">
              All {sessions.length} sessions, your streak and your totals. Back up first if you're
              not sure — this can't be undone. Sessions you built are kept.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  clearSessions()
                  setConfirmingClear(false)
                  setMessage('History cleared.')
                }}
                className="h-11 flex-1 rounded-xl bg-blaze font-semibold text-white active:brightness-95"
              >
                Clear it
              </button>
              <button
                onClick={() => setConfirmingClear(false)}
                className="h-11 flex-1 rounded-xl border border-slate/25 bg-white font-semibold text-ink"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setConfirmingClear(true)}
            disabled={sessions.length === 0}
            className="h-11 w-full text-sm font-semibold text-slate disabled:opacity-40"
          >
            Clear training history
          </button>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-slate">Pitchwork — train on your own, properly.</p>
    </section>
  )
}

function goalHint(minutes: number): string {
  if (minutes === 0) return 'Progress will show minutes without a target'
  const perDay = Math.round(minutes / 7)
  return `About ${perDay} min a day, or ${Math.max(1, Math.round(minutes / 30))} sessions of 30`
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className="flex w-full items-center gap-3 p-4 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-sm text-slate">{hint}</span>
      </span>
      <span
        className={[
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          checked ? 'bg-pitch' : 'bg-slate/30',
        ].join(' ')}
        aria-hidden="true"
      >
        <span
          className={[
            'absolute top-1 h-5 w-5 rounded-full bg-white transition-[left]',
            checked ? 'left-6' : 'left-1',
          ].join(' ')}
        />
      </span>
    </button>
  )
}
