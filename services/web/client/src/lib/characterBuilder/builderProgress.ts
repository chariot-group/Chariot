import type { BuilderAnswers } from "@/lib/rulesetEngine/types";

/**
 * Builder progress kept in the browser session storage, per route, so a reload resumes the builder.
 *
 * @see FR-ruleset-character-builder — Web builder UI (Pages and breadcrumb)
 */

export type BuilderProgress = {
  rulesetId: string;
  answers: BuilderAnswers;
  pageKey: string | null;
  visited: string[];
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const STORAGE_PREFIX = "chariot:character-builder:";

export const builderStorageKey = (scope: string) => `${STORAGE_PREFIX}${scope}`;

function isProgress(value: unknown): value is BuilderProgress {
  if (typeof value !== "object" || value === null) return false;
  const progress = value as Record<string, unknown>;
  return (
    typeof progress.rulesetId === "string" &&
    typeof progress.answers === "object" &&
    progress.answers !== null &&
    !Array.isArray(progress.answers) &&
    (progress.pageKey === null || typeof progress.pageKey === "string") &&
    Array.isArray(progress.visited) &&
    progress.visited.every((key) => typeof key === "string")
  );
}

/** Saved progress of a route, `null` when missing, unreadable or malformed. */
export function loadBuilderProgress(storage: StorageLike | undefined, scope: string): BuilderProgress | null {
  try {
    const raw = storage?.getItem(builderStorageKey(scope));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isProgress(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveBuilderProgress(storage: StorageLike | undefined, scope: string, progress: BuilderProgress) {
  try {
    storage?.setItem(builderStorageKey(scope), JSON.stringify(progress));
  } catch {
    // Quota or private mode: the builder keeps working, only the resume after reload is lost.
  }
}

export function clearBuilderProgress(storage: StorageLike | undefined, scope: string) {
  try {
    storage?.removeItem(builderStorageKey(scope));
  } catch {
    // Same as above.
  }
}
