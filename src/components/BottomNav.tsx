import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

/*
  Bottom navigation — the primary way around the app, kept low so it's reachable
  with one thumb. Six destinations, each a large (56px+) tap target.

  Six is the ceiling, and it is a measured one rather than a guessed one. At the
  narrowest phone width still in use (320px) a cell is 53.3px, and "Challenges" —
  the longest label, and bold whenever it's the active tab — measures 48.8px at
  10px with the tracking below. That is the whole margin: the cell carries no
  horizontal padding for exactly this reason, because the 2px it used to have on
  each side was enough to truncate the label to "Challen…". A seventh tab, or a
  longer word than this one, would have to replace something rather than join it.

  The active tab is marked twice over: a green pill behind the icon and the label
  going bold. One of those alone is easy to miss in daylight on a phone.
*/
type Item = { to: string; label: string; icon: ReactNode }

const items: Item[] = [
  { to: '/', label: 'Home', icon: <HomeIcon /> },
  { to: '/workouts', label: 'Workouts', icon: <WorkoutsIcon /> },
  { to: '/challenges', label: 'Challenges', icon: <ChallengesIcon /> },
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
      <ul className="mx-auto w-full max-w-md grid grid-cols-6">
        {items.map((item) => (
          <li key={item.to} className="min-w-0">
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1 h-16 text-[10px] tracking-tight',
                  isActive ? 'text-pitch font-bold' : 'text-slate font-medium',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'grid h-8 w-10 place-items-center rounded-full transition-all duration-200',
                      isActive ? 'bg-pitch/12 scale-100' : 'bg-transparent scale-95',
                    ].join(' ')}
                  >
                    {item.icon}
                  </span>
                  <span className="w-full truncate text-center">{item.label}</span>
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
/* A corner flag — the one thing on a pitch that marks a fixed point in a plan. */
function ChallengesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...S}>
      <path d="M7 21V3" />
      <path d="M7 4h11l-2.5 3.5L18 11H7" />
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
