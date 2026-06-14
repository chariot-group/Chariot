"use client";

import * as React from "react";
import type { InitiativeTrackerRow } from "@/store/slices/sessionSlice";
import { getInitiativeTrackerRowStatus } from "@/components/initiativeTracker/utils";

export const STATUS_CHANGE_DURATION_MS = 3000;

export type RowStatusAnimation = "dead" | "unconscious";

/**
 * Detects when a row whose `lifeStatus` is visible transitions to `dead` or
 * `unconscious`. Returns a Map<rowId, animation> that auto-clears after 3 s.
 * Does NOT fire on initial mount.
 */
export function useStatusChangedRows(
  rows: InitiativeTrackerRow[],
  isGm: boolean,
): Map<string, RowStatusAnimation> {
  const rowsKey = rows.map((r) => `${r.id}:${r.hitPoints}:${r.deathSavesFailures}`).join(",");
  const prevStatusRef = React.useRef<Map<string, string> | null>(null);
  const [changedRows, setChangedRows] = React.useState<Map<string, RowStatusAnimation>>(
    () => new Map(),
  );

  React.useEffect(() => {
    const current = new Map<string, string>();
    for (const row of rows) {
      const lifeStatusVisible = isGm || row.playerFieldVisibility.lifeStatus;
      if (!lifeStatusVisible) continue;
      current.set(row.id, getInitiativeTrackerRowStatus(row));
    }

    if (prevStatusRef.current === null) {
      prevStatusRef.current = current;
      return;
    }

    const prev = prevStatusRef.current;
    const changed = new Map<string, RowStatusAnimation>();

    for (const [id, status] of current) {
      const prevStatus = prev.get(id);
      if (prevStatus === undefined || prevStatus === status) continue;
      if (status === "dead" || status === "unconscious") {
        changed.set(id, status);
      }
    }

    prevStatusRef.current = current;

    if (changed.size === 0) return;

    setChangedRows((curr) => {
      const next = new Map(curr);
      for (const [id, status] of changed) next.set(id, status);
      return next;
    });

    const timeout = setTimeout(() => {
      setChangedRows((curr) => {
        const next = new Map(curr);
        for (const id of changed.keys()) next.delete(id);
        return next;
      });
    }, STATUS_CHANGE_DURATION_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsKey, isGm]);

  return changedRows;
}
