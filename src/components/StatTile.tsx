import type { ReactNode } from 'react'

/*
  One number, said plainly. Used wherever a figure is the whole story and a chart
  would be dressing it up — totals, streaks, a session's headline stats.

  `accent` lets a tile carry the app's colour when the number is an achievement
  (a streak, a personal best) rather than a neutral count. Used sparingly: if every
  tile is coloured, none of them are.
*/
export default function StatTile({
  value,
  label,
  accent = false,
}: {
  value: ReactNode
  label: string
  accent?: boolean
}) {
  return (
    <div
      className={[
        'card px-2 py-4 text-center',
        accent ? 'border-sun/40 bg-sun/12' : '',
      ].join(' ')}
    >
      <p
        className={[
          'font-display text-3xl font-extrabold leading-none tnum',
          accent ? 'text-sun' : 'text-ink',
        ].join(' ')}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs font-medium text-slate">{label}</p>
    </div>
  )
}
