import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

/*
  Bottom navigation — the primary way around the app, kept low so it's reachable
  with one thumb. Five destinations, each a large (56px+) tap target. The active
  tab is marked with a chalk line, matching our signature stroke.
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
      className="fixed bottom-0 inset-x-0 z-10 bg-chalk/95 backdrop-blur border-t border-slate/15"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto w-full max-w-md grid grid-cols-5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1 h-16 text-xs font-medium',
                  isActive ? 'text-pitch' : 'text-slate',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {item.icon}
                  <span>{item.label}</span>
                  <span
                    className={`chalk-line w-6 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                    aria-hidden="true"
                  />
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
