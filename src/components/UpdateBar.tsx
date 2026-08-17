import { useServiceWorker } from '../lib/pwa'

/*
  "There's a new version" — shown only when one is genuinely downloaded and waiting.

  It sits at the TOP rather than above the bottom nav, because the bottom of the
  screen belongs to the thing you came here to do. It is dismissable by ignoring it:
  there is no close button, because the bar disappears the moment you reload anyway,
  and a dismissed update is one the user can never get back to.
*/
export default function UpdateBar() {
  const { ready, apply } = useServiceWorker()
  if (!ready) return null

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-3 pt-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-chalk shadow-lift">
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
          A new version of Pitchwork is ready.
        </p>
        <button
          onClick={apply}
          className="shrink-0 rounded-xl bg-lime px-3.5 py-2 text-sm font-extrabold text-ink active:scale-[0.97]"
        >
          Reload
        </button>
      </div>
    </div>
  )
}
