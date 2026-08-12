import { useSyncExternalStore } from 'react'

/*
  A tiny store: one value, anyone can subscribe, writes go to localStorage on the
  way past. Three things in the app now outlive a single screen — the sessions you
  built, your training history, and your settings — and all three are read in one
  place and written in another. This is the shared plumbing so none of them has to
  invent it, and so a write is seen everywhere at once instead of on next refresh.
*/

export interface Store<T> {
  get: () => T
  set: (next: T) => void
  subscribe: (listener: () => void) => () => void
}

export function createStore<T>(initial: T, persist?: (value: T) => void): Store<T> {
  let value = initial
  const listeners = new Set<() => void>()

  return {
    get: () => value,
    set(next) {
      value = next
      persist?.(next)
      listeners.forEach((notify) => notify())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

// Read a store from a component. The snapshot is only ever replaced on a write, so
// React compares it by identity and re-renders exactly when something changed.
export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get)
}
