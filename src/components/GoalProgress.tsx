/*
  This week against your goal, drawn as a chalk line — the app's signature stroke
  doing the job a progress ring would do elsewhere.

  Going past the goal doesn't overflow the bar; it fills it and says so, because
  "110 of 90 min" is a better reward than a bar that has nowhere left to go.

  `tone` exists because this now appears on the dark home hero as well as on white
  cards, and a slate label on near-black is unreadable. Same component, same
  numbers — only the two ink colours swap.
*/
export default function GoalProgress({
  minutes,
  goalMinutes,
  tone = 'light',
}: {
  minutes: number
  goalMinutes: number
  tone?: 'light' | 'dark'
}) {
  const pct = goalMinutes > 0 ? Math.min(100, (minutes / goalMinutes) * 100) : 0
  const met = goalMinutes > 0 && minutes >= goalMinutes
  const left = Math.max(0, goalMinutes - minutes)

  const dark = tone === 'dark'
  const strong = dark ? 'text-chalk' : 'text-ink'
  const muted = dark ? 'text-chalk/60' : 'text-slate'
  const track = dark ? 'bg-chalk/15' : 'bg-slate/20'

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className={`font-display text-4xl font-extrabold leading-none tnum ${strong}`}>
          {minutes}
          <span className={`text-base font-bold ${muted}`}> / {goalMinutes} min</span>
        </p>
        <p className={`text-sm font-semibold ${met ? 'text-lime' : muted}`}>
          {goalMinutes === 0 ? 'No goal set' : met ? 'Goal met ✓' : `${left} to go`}
        </p>
      </div>

      {/* 6px rather than the old 4px: on the hero this is the one thing you read
          from across the room, and a hairline reads as a divider, not progress. */}
      <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${track}`}>
        <div
          className="chalk-line h-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, minWidth: minutes > 0 ? '6px' : '0' }}
          role="progressbar"
          aria-valuenow={minutes}
          aria-valuemin={0}
          aria-valuemax={goalMinutes}
          aria-label="Minutes trained this week against your goal"
        />
      </div>
    </div>
  )
}
