/**
 * FR-tracker-initiative-modifier-display — flush pending initiative field text
 * before locking inputs (e.g. Start combat) so unblurred values are not lost.
 */

const flushers = new Set<() => void>();

export function registerInitiativeInputFlush(flush: () => void): () => void {
  flushers.add(flush);
  return () => {
    flushers.delete(flush);
  };
}

export function flushPendingInitiativeInputs(): void {
  for (const flush of [...flushers]) {
    flush();
  }
}
