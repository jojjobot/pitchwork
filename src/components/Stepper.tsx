/*
  A number you change by tapping, not typing. Every value in the block editor is a
  small number with sensible bounds, and a phone keyboard covering half the screen
  while you set "3 sets" is a worse experience than two big buttons.
*/
export default function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format = String,
  hint,
  onReset,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  format?: (value: number) => string
  hint?: string
  onReset?: () => void
}) {
  // Steps land on multiples of `step` even if the stored value started off one.
  const bump = (delta: number) => {
    const raw = delta > 0 ? Math.floor(value / step) * step + step : Math.ceil(value / step) * step - step
    onChange(Math.min(max, Math.max(min, raw)))
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate">{label}</p>
        {onReset ? (
          <button onClick={onReset} className="text-xs font-semibold text-pitch">
            Use drill default
          </button>
        ) : (
          hint && <span className="text-xs text-slate">{hint}</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <StepButton label={`Decrease ${label}`} onClick={() => bump(-1)} disabled={value <= min}>
          −
        </StepButton>
        <p className="flex-1 text-center font-display text-2xl font-extrabold tabular-nums text-ink">
          {format(value)}
        </p>
        <StepButton label={`Increase ${label}`} onClick={() => bump(1)} disabled={value >= max}>
          +
        </StepButton>
      </div>
      {onReset && hint && <p className="mt-1 text-right text-xs text-slate">{hint}</p>}
    </div>
  )
}

function StepButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled: boolean
  children: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-slate/25 bg-white font-display text-xl font-bold text-ink disabled:opacity-35"
    >
      {children}
    </button>
  )
}
