import { useState } from 'react'
import { formatWeekLabel, type Week } from '../lib/progress'

/*
  Minutes trained per week. One series, so one colour and no legend — the heading
  says what the bars are. Empty weeks are drawn as empty, because a gap in training
  is the most useful thing this chart can tell you.

  On a phone there is no hover, so a bar is a tap target: tapping one puts its
  numbers in the readout above. Twelve labels won't fit across a phone, so only the
  ends are labelled and every bar carries its own description for screen readers.
*/
export default function WeeklyChart({ weeks, goalMinutes }: { weeks: Week[]; goalMinutes: number }) {
  // The current week is the one you care about by default.
  const [selected, setSelected] = useState(weeks.length - 1)
  const active = weeks[Math.min(selected, weeks.length - 1)] ?? weeks[weeks.length - 1]

  const busiest = Math.max(...weeks.map((w) => w.minutes))
  // Keep the goal line on the chart even in a quiet stretch, and never divide by zero.
  const ceiling = Math.max(busiest, goalMinutes, 1)
  const goalOffset = (goalMinutes / ceiling) * 100

  return (
    <div>
      {/* Readout — the only place a number is printed, so the bars stay clean */}
      <p className="text-sm text-slate">
        <span className="font-semibold text-ink">
          {active.isCurrent ? 'This week' : `Week of ${formatWeekLabel(active.start)}`}
        </span>
        {' · '}
        {active.minutes} min
        {active.sessions > 0 && ` · ${active.sessions} ${active.sessions === 1 ? 'session' : 'sessions'}`}
      </p>

      <div className="relative mt-3 h-32">
        {/* Goal line, sitting behind the bars */}
        {goalMinutes > 0 && (
          <div
            className="absolute inset-x-0 border-t border-dashed border-slate/40"
            style={{ bottom: `${goalOffset}%` }}
            aria-hidden="true"
          />
        )}

        <div className="flex h-full items-end gap-0.5">
          {weeks.map((week, i) => {
            const height = (week.minutes / ceiling) * 100
            const isSelected = i === Math.min(selected, weeks.length - 1)
            return (
              <button
                key={week.start.getTime()}
                onClick={() => setSelected(i)}
                aria-label={`Week of ${formatWeekLabel(week.start)}: ${week.minutes} minutes over ${week.sessions} sessions`}
                aria-pressed={isSelected}
                className="group relative flex h-full flex-1 items-end"
              >
                {/* A resting tick so an empty week still reads as a week, not a hole.
                    Exactly one background class — two would leave the winner up to
                    CSS order rather than to this condition. */}
                <span
                  className={[
                    'w-full rounded-t-md transition-[height] duration-500 ease-out',
                    week.minutes === 0 ? 'bg-slate/25' : '',
                    isSelected ? 'ring-2 ring-ink' : '',
                  ].join(' ')}
                  style={{
                    height: week.minutes === 0 ? '2px' : `max(3px, ${height}%)`,
                    // Bars fade towards the baseline so a tall column has weight at
                    // the top, where you read it, instead of a flat slab of green.
                    backgroundImage:
                      week.minutes === 0
                        ? undefined
                        : 'linear-gradient(180deg, #2f9463 0%, #1f6f4b 100%)',
                  }}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* Baseline */}
      <div className="h-px bg-slate/25" aria-hidden="true" />
      <div className="mt-1 flex justify-between text-xs text-slate">
        <span>{weeks.length} weeks ago</span>
        {goalMinutes > 0 && <span className="text-slate/70">dashed line = your goal</span>}
        <span className="font-semibold text-ink">This week</span>
      </div>
    </div>
  )
}
