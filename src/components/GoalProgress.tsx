/*
  This week against your goal, drawn as a chalk line — the app's signature stroke
  doing the job a progress ring would do elsewhere.

  Going past the goal doesn't overflow the bar; it fills it and says so, because
  "110 of 90 min" is a better reward than a bar that has nowhere left to go.
*/
export default function GoalProgress({ minutes, goalMinutes }: { minutes: number; goalMinutes: number }) {
  const pct = goalMinutes > 0 ? Math.min(100, (minutes / goalMinutes) * 100) : 0
  const met = goalMinutes > 0 && minutes >= goalMinutes
  const left = Math.max(0, goalMinutes - minutes)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-2xl font-extrabold leading-none text-ink">
          {minutes}
          <span className="text-base font-bold text-slate"> / {goalMinutes} min</span>
        </p>
        <p className="text-sm font-semibold text-slate">
          {goalMinutes === 0 ? 'No goal set' : met ? 'Goal met' : `${left} to go`}
        </p>
      </div>

      <div className="mt-2 h-1 rounded-full bg-slate/20">
        <div
          className="chalk-line transition-[width]"
          style={{ width: `${pct}%`, minWidth: minutes > 0 ? '4px' : '0' }}
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
