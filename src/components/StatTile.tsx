import type { ReactNode } from 'react'

/*
  One number, said plainly. Used wherever a figure is the whole story and a chart
  would be dressing it up — totals, streaks, a session's headline stats.
*/
export default function StatTile({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-slate/15 bg-white/70 py-4 text-center">
      <p className="font-display text-3xl font-extrabold leading-none text-ink">{value}</p>
      <p className="mt-1 text-xs text-slate">{label}</p>
    </div>
  )
}
