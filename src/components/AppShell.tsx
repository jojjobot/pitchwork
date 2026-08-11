import { Link, Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

/*
  The frame that wraps every main screen: a slim top header with the wordmark
  and a settings button, the screen content in the middle, and the thumb-reachable
  bottom navigation. Content is capped at a phone-ish width and centred so it also
  looks intentional on a laptop.
*/
export default function AppShell() {
  return (
    <div className="min-h-[100svh] flex flex-col bg-chalk">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-chalk/95 backdrop-blur border-b border-slate/15">
        <div className="mx-auto w-full max-w-md px-5 h-14 flex items-center justify-between">
          <Link to="/" className="flex flex-col leading-none">
            <span className="font-display font-extrabold text-xl tracking-tight text-ink">
              Pitchwork
            </span>
            {/* the chalk line under the wordmark — our signature stroke */}
            <span className="chalk-line mt-1 w-16" aria-hidden="true" />
          </Link>

          <Link
            to="/settings"
            aria-label="Settings"
            className="grid place-items-center h-11 w-11 rounded-full text-ink hover:bg-slate/10"
          >
            <GearIcon />
          </Link>
        </div>
      </header>

      {/* Screen content */}
      <main className="flex-1 mx-auto w-full max-w-md px-5 pt-5 pb-28">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}

function GearIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
