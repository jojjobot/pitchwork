import type { Exercise } from '../types'

// "45s", "1:30", "12:00" — used for timers and durations.
export function formatSeconds(total: number): string {
  if (total < 60) return `${total}s`
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// A short prescription line, e.g. "3 × 45s" (time) or "3 × 12" (reps).
export function prescription(ex: Exercise): string {
  const per = ex.measureType === 'reps' ? `${ex.defaultReps}` : formatSeconds(ex.defaultDuration)
  return ex.defaultSets > 1 ? `${ex.defaultSets} × ${per}` : per
}
