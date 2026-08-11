/*
  Tiny sound + vibration helpers for the session player.
  Sounds are generated with the Web Audio API (no audio files to load). Both are
  best-effort: if the browser blocks them or doesn't support them, we just stay quiet.
*/

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// Call once from a user gesture (the Start button) so audio is allowed to play.
export function primeAudio(): void {
  getCtx()
}

export function playTone(freq: number, durationMs = 140, gain = 0.14): void {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  osc.connect(g)
  g.connect(c.destination)
  const now = c.currentTime
  g.gain.setValueAtTime(gain, now)
  g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)
  osc.start(now)
  osc.stop(now + durationMs / 1000)
}

export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // ignore
    }
  }
}
