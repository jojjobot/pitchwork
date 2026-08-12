import { categoryMinutesSorted } from '../lib/workout'
import { CATEGORY_ACCENT, CATEGORY_LABELS } from '../lib/labels'
import type { Category } from '../types'

/*
  Where a session's minutes actually go, biggest share first. Shared by the workout
  detail page and the builder so a session you build is measured on exactly the same
  scale as one from the programme.
*/
export default function CategoryBars({
  categorySeconds,
  totalMinutes,
}: {
  categorySeconds: Partial<Record<Category, number>>
  totalMinutes: number
}) {
  const breakdown = categoryMinutesSorted(categorySeconds)
  if (breakdown.length === 0) return null

  return (
    <div className="space-y-2">
      {breakdown.map(({ category, minutes }) => (
        <div key={category} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-sm font-medium">{CATEGORY_LABELS[category]}</span>
          <div className="h-2.5 flex-1 rounded-full bg-slate/15">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (minutes / Math.max(1, totalMinutes)) * 100)}%`,
                backgroundColor: CATEGORY_ACCENT[category],
              }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-sm text-slate">{minutes}m</span>
        </div>
      ))}
    </div>
  )
}
