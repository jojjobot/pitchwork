import { Link, Outlet, useLocation } from 'react-router-dom'
import AccountMenu from './AccountMenu'
import BottomNav from './BottomNav'
import { Mark } from './PitchArt'

/*
  The frame that wraps every main screen: a slim top header with the wordmark
  and the account button, the screen content in the middle, and the thumb-reachable
  bottom navigation. Content is capped at a phone-ish width and centred so it also
  looks intentional on a laptop.

  The top-right corner is the only way to Settings — the bottom nav has no room for
  it — so whatever lives up there must always keep that route reachable.
*/
export default function AppShell() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-[100svh] flex flex-col">
      {/* Header. The green hairline under it is the chalk line's quiet cousin:
          it ties the header to the pitch texture instead of drawing a box. */}
      <header className="sticky top-0 z-20 border-b border-slate/12 bg-chalk/80 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-md px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Mark size={30} />
            <span className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-xl tracking-tight text-ink">
                Pitchwork
              </span>
              {/* the chalk line under the wordmark — our signature stroke */}
              <span className="chalk-line mt-1 w-14" aria-hidden="true" />
            </span>
          </Link>

          <AccountMenu />
        </div>
        <div
          className="h-px w-full"
          style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(31,111,75,0.35), transparent)' }}
          aria-hidden="true"
        />
      </header>

      {/* Screen content. Keyed on the route so every screen animates in rather
          than snapping — the app's only page transition. */}
      <main key={pathname} className="rise flex-1 mx-auto w-full max-w-md px-5 pt-6 pb-28">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
