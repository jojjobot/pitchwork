/*
  A temporary placeholder used for Phase 0 only, so we can see navigation working
  before any real features exist. Each real screen replaces this in a later phase.
*/
export default function ScreenPlaceholder({
  title,
  phase,
  children,
}: {
  title: string
  phase: string
  children: string
}) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-widest text-pitch">
        {phase}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink">
        {title}
      </h1>
      <div className="chalk-line mt-3 w-24" aria-hidden="true" />
      <p className="mt-6 max-w-sm text-slate leading-relaxed">{children}</p>
    </section>
  )
}
