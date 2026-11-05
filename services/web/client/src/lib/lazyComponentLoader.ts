import type { ComponentType } from "react";

export type LazyModuleLoader<P> = () => Promise<{ default: ComponentType<P> }>;

export interface LazyComponentLoader<P> {
  /** Component already fetched, or null while it has never loaded successfully. */
  getLoaded: () => ComponentType<P> | null;
  /** Fetches the module once; concurrent calls share the same request, a failure allows a retry. */
  load: () => Promise<ComponentType<P>>;
  /** Fire-and-forget `load()` for hover/focus prefetch; failures are left to the render path. */
  preload: () => void;
}

/**
 * Caches an on-demand `import()` so a dialog or form is fetched only when needed.
 * @see FR-web-first-load-performance
 */
export function createLazyComponentLoader<P>(loader: LazyModuleLoader<P>): LazyComponentLoader<P> {
  let loaded: ComponentType<P> | null = null;
  let pending: Promise<ComponentType<P>> | null = null;

  const load = () => {
    if (loaded) return Promise.resolve(loaded);
    if (!pending) {
      pending = loader()
        .then((module) => {
          loaded = module.default;
          return module.default;
        })
        .catch((error: unknown) => {
          // Drop the rejected promise so the next open retries the fetch.
          pending = null;
          throw error;
        });
    }
    return pending;
  };

  return {
    getLoaded: () => loaded,
    load,
    preload: () => {
      load().catch(() => {
        // Prefetch only: the render path reports the failure and retries.
      });
    },
  };
}

/**
 * A dialog stays mounted once opened so Radix close animations still play;
 * it is never mounted (nor fetched) before its first open.
 */
export function shouldMountLazyDialog(open: boolean, hasBeenOpened: boolean): boolean {
  return open || hasBeenOpened;
}
