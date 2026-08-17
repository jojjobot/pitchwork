/*
  PITCHWORK'S SERVICE WORKER.

  The sign-in screen has always promised "works offline". Until now that was a claim
  about the data — everything lives in localStorage, so nothing needs a server once
  the page is open — but the page itself still had to be fetched, so a phone with no
  signal got nothing at all. This closes that gap: after one successful visit the app
  opens on the underground.

  THE RULE THAT KEEPS DEPLOYS SANE. A cache that serves the HTML first is how an app
  gets stuck on an old version forever, and this project has already spent an evening
  on "I pushed it and nothing changed". So:

    - the page itself is NETWORK-FIRST. Online, you always get the newest build; the
      cache is only the fallback when the network fails.
    - the build's assets are hashed (index-BmSZV4Be.js), so their names change when
      their contents do. They can safely be served cache-first — a stale one is
      impossible, because a new build asks for a different name.
    - a new worker never activates on its own. It waits, the app notices and offers a
      reload, and the user decides when the version changes under them. Nothing swaps
      mid-session while a timer is running.
*/

const VERSION = 'v1'
const CACHE = `pitchwork-${VERSION}`

// The shell, by hand. The hashed build assets are not listed because their names are
// only known at build time — they get cached the first time they're actually fetched,
// which for a single-bundle app means "during the first visit".
const SHELL = [
  './',
  './index.html',
  './fonts.css',
  './icon.svg',
  './apple-touch-icon.png',
  './manifest.webmanifest',
  './fonts/bricolage-grotesque-latin.woff2',
  './fonts/bricolage-grotesque-latin-ext.woff2',
  './fonts/hanken-grotesk-latin.woff2',
  './fonts/hanken-grotesk-latin-ext.woff2',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // addAll fails the whole install if any single file 404s, which would leave the
      // app with no worker at all. Each file is added on its own so one bad path can
      // only cost that file.
      Promise.all(SHELL.map((url) => cache.add(url).catch(() => undefined))),
    ),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

// The app asks for this when the user accepts an update.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // analytics and anything else: untouched

  // The page. Network first, cache as a safety net.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          const cache = await caches.open(CACHE)
          cache.put('./index.html', fresh.clone())
          return fresh
        } catch {
          const cache = await caches.open(CACHE)
          return (await cache.match('./index.html')) ?? (await cache.match('./')) ?? Response.error()
        }
      })(),
    )
    return
  }

  // Everything else: serve what we have, and quietly refresh it for next time.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const hit = await cache.match(request)
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) cache.put(request, response.clone())
          return response
        })
        .catch(() => undefined)
      return hit ?? (await network) ?? Response.error()
    })(),
  )
})
