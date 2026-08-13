import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { displayName, useAccount } from '../lib/auth'

/*
  The account button in the top-right corner of every screen. Tapping it opens a
  small panel saying who you're signed in as — for now that is the whole panel.
  Nothing in here *changes* anything: everything with a consequence (sign out,
  password, backups, deleting the account) stays on the Settings screen, one tap
  further in, so a stray tap near the corner can never do damage.
*/
export default function AccountMenu() {
  const account = useAccount()
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  // Changing screen closes it, so the panel never outlives the screen it opened on.
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!account) return null

  const name = displayName(account)

  return (
    <div ref={wrapper} className="relative">
      <button
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
        aria-controls="account-panel"
        aria-label={`Account — signed in as ${account.email}`}
        className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-slate/10"
      >
        <Initial name={name} />
      </button>

      {open && (
        <div
          id="account-panel"
          className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-slate/15 bg-white p-4 shadow-lg shadow-ink/10"
        >
          <div className="flex items-center gap-3">
            <Initial name={name} large />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink" title={name}>
                {name}
              </p>
              <p className="truncate text-sm text-slate" title={account.email}>
                {account.email}
              </p>
            </div>
          </div>

          <Link
            to="/settings"
            className="mt-4 flex h-11 items-center justify-center rounded-xl border border-slate/25 bg-white font-semibold text-ink active:bg-chalk"
          >
            Settings
          </Link>
        </div>
      )}
    </div>
  )
}

// The first letter of the name, on the brand green — a stand-in for the profile
// picture we have no way of storing.
function Initial({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        'grid shrink-0 place-items-center rounded-full bg-pitch font-display font-extrabold text-chalk',
        large ? 'h-11 w-11 text-lg' : 'h-9 w-9 text-base',
      ].join(' ')}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}
