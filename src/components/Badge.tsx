import type { ReactNode } from 'react'

/*
  A small pill used for meta info (difficulty, space, equipment...).
  Pass `dot` for a coloured leading dot (used to tint by category).
*/
export default function Badge({ children, dot }: { children: ReactNode; dot?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate/25 bg-white/60 px-2.5 py-1 text-xs font-medium text-ink">
      {dot && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: dot }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
