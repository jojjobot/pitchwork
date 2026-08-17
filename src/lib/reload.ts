/*
  A registry of "re-read yourself from storage" callbacks.

  Two things need to swap every store's contents at once: signing in or out, which
  changes whose drawer is open, and a cloud sync, which rewrites those drawers from
  under the app. Both used to mean importing all five stores and calling all five
  reloads in the right order.

  It is a registry rather than five imports because of the direction of the arrows.
  lib/cloud.ts has to be able to reload the stores; the stores have to be able to
  tell lib/cloud.ts that something changed. Importing each other directly is a
  cycle. Each store registers itself here on import instead, and nobody has to know
  who else exists.
*/
const reloaders = new Set<() => void>()

export function registerReloader(reload: () => void): void {
  reloaders.add(reload)
}

/** Re-read every store from storage. */
export function reloadAll(): void {
  for (const reload of reloaders) reload()
}
