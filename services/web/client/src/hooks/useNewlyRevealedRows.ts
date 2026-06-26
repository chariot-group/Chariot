"use client";

import * as React from "react";

export const REVEAL_DURATION_MS = 3000;

/** Pure helper: returns IDs from `current` that are not in `prev`. */
export function findNewIds(prev: Set<string>, current: string[]): string[] {
  return current.filter((id) => !prev.has(id));
}

/**
 * FR-tracker-combatant-reveal — Detects row IDs that newly appeared in `visibleIds` compared to the previous render.
 * Returns a Set of IDs currently in "newly revealed" state (auto-clears after 3 s).
 * Does NOT fire on initial mount — only on subsequent transitions.
 */
export function useNewlyRevealedRows(visibleIds: string[]): Set<string> {
  const idsKey = visibleIds.join(",");
  const prevIdsRef = React.useRef<Set<string> | null>(null);
  const [newlyRevealed, setNewlyRevealed] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    const current = new Set(visibleIds);

    if (prevIdsRef.current === null) {
      prevIdsRef.current = current;
      return;
    }

    const prev = prevIdsRef.current;
    const added = visibleIds.filter((id) => !prev.has(id));
    prevIdsRef.current = current;

    if (added.length === 0) return;

    const addedSet = new Set(added);
    setNewlyRevealed((curr) => {
      const next = new Set(curr);
      addedSet.forEach((id) => next.add(id));
      return next;
    });

    const timeout = setTimeout(() => {
      setNewlyRevealed((curr) => {
        const next = new Set(curr);
        addedSet.forEach((id) => next.delete(id));
        return next;
      });
    }, REVEAL_DURATION_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return newlyRevealed;
}
