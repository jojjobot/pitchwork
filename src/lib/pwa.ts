import { useEffect, useState } from 'react'

/*
  Registering the service worker, and noticing when a new one is ready.

  The worker itself never activates on its own (see public/sw.js). That is deliberate:
  a version that swaps itself in mid-session could change the app underneath a running
  timer. Instead a new build sits in "waiting" until this module spots it, the app puts
  a small bar on screen, and the user reloads when they're ready.

  This is also the answer to the recurring "I deployed and nothing changed": once the
  worker is in place, the update is something the app can actually tell you about,
  rather than something you have to guess at by pulling the page down hard enough.
*/

const SW_URL = `${import.meta.env.BASE_URL}sw.js`

export interface UpdateState {
  /** A newer build is downloaded and waiting to take over. */
  ready: boolean
  /** Hand over to it and reload. */
  apply: () => void
}

export function useServiceWorker(): UpdateState {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    // Dev runs from source with no built assets to cache, and a worker there mostly
    // gets in the way of hot reload.
    if (import.meta.env.DEV) return

    let cancelled = false

    navigator.serviceWorker
      .register(SW_URL, { scope: import.meta.env.BASE_URL })
      .then((registration) => {
        if (cancelled) return

        // Already waiting when the page opened — a build landed since last time.
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaiting(registration.waiting)
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            // `controller` is null on the very first visit — that install is not an
            // update, it's the app arriving, and there is nothing to announce.
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setWaiting(installing)
            }
          })
        })
      })
      .catch(() => {
        // No worker is a working app, just one that needs the network. Never fatal.
      })

    // The new worker took over: reload once so the page matches the code serving it.
    let reloading = false
    const onControllerChange = () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  return {
    ready: waiting != null,
    apply: () => waiting?.postMessage('SKIP_WAITING'),
  }
}
