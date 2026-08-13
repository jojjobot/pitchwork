/*
  GoatCounter — the one thing in Pitchwork that talks to a server.

  What leaves the browser: which screen was opened, and a bare "someone made an
  account" ping. That's it. No email, no name, no training, no id that follows
  anyone between visits — GoatCounter sets no cookies and keeps no profiles, which
  is why the app needs no consent banner.

  Two rules keep it honest:
  - Concrete ids are replaced by their route pattern before sending (see `pattern`),
    so the dashboard reads "/library/:exercise" rather than 146 separate rows, and
    which drills a person opened never leaves their device.
  - Nothing is sent from localhost or from Node, so development and the test scripts
    can't pollute real numbers.
*/

declare global {
  interface Window {
    goatcounter?: {
      no_onload?: boolean
      count?: (vars: { path: string; title?: string; event?: boolean }) => void
    }
  }
}

// Deliberately not `import.meta.env.PROD`: this module is reachable from auth.ts,
// which the jiti test scripts import under plain Node where import.meta.env is
// undefined. A hostname check needs nothing but a browser.
function enabled(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host !== 'localhost' && host !== '127.0.0.1' && host !== ''
}

function send(vars: { path: string; title?: string; event?: boolean }): void {
  if (!enabled()) return
  // Absent when the script is still loading, blocked by an ad blocker, or offline.
  // Analytics is never worth an exception, so a miss is simply a miss.
  try {
    window.goatcounter?.count?.(vars)
  } catch {
    /* ignore */
  }
}

// Most specific first — /builder/x/add must win before /builder/:workout.
const PATTERNS: [RegExp, string][] = [
  [/^\/workouts\/[^/]+$/, '/workouts/:workout'],
  [/^\/library\/[^/]+$/, '/library/:exercise'],
  [/^\/history\/[^/]+$/, '/history/:session'],
  [/^\/builder\/[^/]+\/block\/[^/]+$/, '/builder/:workout/block/:index'],
  [/^\/builder\/[^/]+\/add$/, '/builder/:workout/add'],
  [/^\/builder\/[^/]+$/, '/builder/:workout'],
  [/^\/session\/[^/]+$/, '/session/:workout'],
]

export function pattern(pathname: string): string {
  for (const [match, replacement] of PATTERNS) {
    if (match.test(pathname)) return replacement
  }
  return pathname
}

export function countPageview(pathname: string): void {
  send({ path: pattern(pathname) })
}

// The path doubles as the event name in GoatCounter, so it must not start with "/".
export function countEvent(name: string): void {
  send({ path: name, event: true })
}
