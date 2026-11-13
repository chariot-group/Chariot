/**
 * Synchronous single-flight guard: a call made while the previous one is still running is ignored
 * (resolves to `undefined` without calling the task). Released on success and on failure.
 * Used by the sidebar « Load more » actions, whose Redux `loadingMore` flag only blocks after a re-render.
 * @see FR-sidebar-navigation
 */
export interface InFlightGuard {
  run<T>(task: () => Promise<T>): Promise<T | undefined>;
  readonly busy: boolean;
}

export function createInFlightGuard(): InFlightGuard {
  let busy = false;
  return {
    get busy() {
      return busy;
    },
    async run<T>(task: () => Promise<T>): Promise<T | undefined> {
      if (busy) return undefined;
      busy = true;
      try {
        return await task();
      } finally {
        busy = false;
      }
    },
  };
}
