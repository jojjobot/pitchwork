import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

/*
  The bar that holds a screen's one big action — Start training, Start today —
  floating just above the bottom nav so it's under your thumb wherever you are on
  the page.

  IT IS A PORTAL, AND THAT IS THE WHOLE POINT.

  `position: fixed` is measured against the viewport only while no ancestor has a
  transform. `AppShell`'s <main> runs the `rise` page-in animation with
  `animation-fill-mode: both`, which leaves an identity transform on it forever
  after — and an identity transform is still a transform, so it becomes the
  containing block for everything fixed inside it.

  Rendered inline, this bar therefore stopped being fixed at all and parked itself
  at the bottom of the document: on a long page the Start button sat ~4800px down,
  off-screen, unreachable without scrolling the entire plan. It shipped that way and
  nobody saw it, because it looks perfectly correct on any page short enough to fit
  the screen.

  Portalling to <body> puts the bar outside <main>, where nothing is transformed and
  fixed means fixed. Don't move it back inside a screen.

  It also owns the safe-area maths, so there is one place to get it right: it clears
  the 4rem nav plus whatever the phone reserves for its home indicator.
*/
export default function StickyBar({ children }: { children: ReactNode }) {
  return createPortal(
    <div
      className="fixed inset-x-0 z-10 bg-gradient-to-t from-chalk via-chalk/95 to-transparent px-5 pt-6 pb-3"
      style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="mx-auto max-w-md">{children}</div>
    </div>,
    document.body,
  )
}
