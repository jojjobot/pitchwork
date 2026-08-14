import type { ReactNode } from 'react'

/*
  Two small, reusable filter controls used on the Library and Workouts screens.
  Kept deliberately plain and reliable: big tap targets, no hover-only behaviour.
*/

export function Chip({
  active,
  onClick,
  children,
  dot,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  dot?: string
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-4 h-10 text-sm font-semibold whitespace-nowrap border transition-all duration-150 active:scale-95',
        active
          ? 'bg-ink text-chalk border-ink shadow-card'
          : 'bg-paper/80 text-ink border-slate/20 backdrop-blur',
      ].join(' ')}
    >
      {dot && (
        <span
          className="h-2.5 w-2.5 rounded-full ring-1 ring-white/50"
          style={{ backgroundColor: dot }}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: [T, string][]
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([val, text]) => (
          <button
            key={val}
            onClick={() => onChange(val)}
            className={[
              'rounded-lg px-3 h-10 text-sm font-semibold border transition-all duration-150 active:scale-95',
              value === val
                ? 'bg-pitch text-white border-pitch shadow-card'
                : 'bg-paper/80 text-ink border-slate/20',
            ].join(' ')}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}
