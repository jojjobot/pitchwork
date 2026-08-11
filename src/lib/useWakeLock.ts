import { useEffect } from 'react'

/*
  Keeps the screen from sleeping while `active` is true (during a session), where the
  browser supports the Wake Lock API. Silently does nothing where it doesn't.
*/
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return

    let lock: WakeLockSentinel | null = null
    let cancelled = false

    async function acquire() {
      try {
        lock = await navigator.wakeLock.request('screen')
      } catch {
        // user denied, or not allowed right now — fine
      }
    }

    // Re-acquire if the tab was hidden and comes back.
    function onVisible() {
      if (!cancelled && document.visibilityState === 'visible') void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release?.()
    }
  }, [active])
}
