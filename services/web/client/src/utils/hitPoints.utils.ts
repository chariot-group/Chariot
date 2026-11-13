/**
 * Current HP "follows" max HP when it is empty or equal to max (character at full health).
 * @see FR-character-statistics-card (edit mode — hit points fields)
 */
export function currentHitPointsFollowsMax(currentHitPoints: unknown, maxHitPoints: unknown): boolean {
  if (currentHitPoints === undefined || currentHitPoints === null || currentHitPoints === "") return true;
  const current = Number(currentHitPoints);
  if (!Number.isFinite(current)) return true;
  return current === Number(maxHitPoints);
}

/**
 * New current HP after max HP changes from `previousMax` to `nextMax`, or `undefined` to leave it untouched.
 * @see FR-character-statistics-card (edit mode — hit points fields)
 */
export function syncCurrentHitPointsOnMaxChange(
  currentHitPoints: unknown,
  previousMax: unknown,
  nextMax: unknown,
): number | undefined {
  if (typeof nextMax !== "number" || !Number.isFinite(nextMax)) return undefined;
  return currentHitPointsFollowsMax(currentHitPoints, previousMax) ? nextMax : undefined;
}
