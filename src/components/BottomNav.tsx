import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

/*
  Bottom navigation — the primary way around the app, kept low so it's reachable
  with one thumb. Five destinations, each a large (56px+) tap target.

  The active tab is marked twice over: a green pill behind the icon and the label
  going bold. One of those alone is easy to miss in daylight on a phone.
*/
type Item = { to: string; label: string; icon: ReactNode }

const items: Item[] = [
  { to: '/', label: 'Home', icon: <HomeIcon /> },
  { to: '/workouts', label: 'Workouts', icon: <WorkoutsIcon /> },
  { to: '/library', label: 'Library', icon: <LibraryIcon /> },
  { to: '/builder', label: 'Build', icon: <BuildIcon /> },
  { to: '/history', label: 'Progress', icon: <ProgressIcon /> },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 border-t border-slate/12 bg-chalk/85 backdrop-blur-xl"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -8px 24px -16px rgba(10,28,20,0.45)',
      }}
    >
      <ul className="mx-auto w-full max-w-md grid grid-cols-5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1 h-16 text-[11px]',
                  isActive ? 'text-pitch font-bold' : 'text-slate font-medium',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'grid h-8 w-12 place-items-center rounded-full transition-all duration-200',
                      isActive ? 'bg-pitch/12 scale-100' : 'bg-transparent scale-95',
                    ].join(' ')}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/* --- Simple line icons (no icon library, keeps the app dependency-free) --- */
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...S}>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  )
}
function WorkoutsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...S}>
      <path d="M4 7v10M20 7v10M4 12h16M2 10v4M22 10v4" />
    </svg>
  )
}
function LibraryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...S}>
      <path d="M4 5h10M4 12h10M4 19h10M18 5h2M18 12h2M18 19h2" />
    </svg>
  )
}
function BuildIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...S}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
function ProgressIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...S}>
      <path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" />
    </svg>
  )
}
