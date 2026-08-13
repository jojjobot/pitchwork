import { Link, Outlet } from 'react-router-dom'
import AccountMenu from './AccountMenu'
import BottomNav from './BottomNav'

/*
  The frame that wraps every main screen: a slim top header with the wordmark
  and the account button, the screen content in the middle, and the thumb-reachable
  bottom navigation. Content is capped at a phone-ish width and centred so it also
  looks intentional on a laptop.

  The top-right corner is the only way to Settings — the bottom nav has no room for
  it — so whatever lives up there must always keep that route reachable.
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

          <AccountMenu />
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
