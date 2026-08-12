import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

/*
  A dead end, handled kindly: what was missing, and one obvious way back. Used
  wherever a link can go stale — a deleted session, a renamed drill, a hand-typed URL.
*/
export default function NotFound({
  title,
  to,
  cta,
  children,
}: {
  title: string
  to: string
  cta: string
  children?: ReactNode
}) {
  return (
    <section className="pt-10 text-center">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      {children && <p className="mt-2 text-slate">{children}</p>}
      <Link
        to={to}
        className="mt-6 inline-block rounded-xl bg-ink px-4 h-11 leading-[44px] font-semibold text-chalk"
      >
        {cta}
      </Link>
    </section>
  )
}
