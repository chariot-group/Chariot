/** @see FR-load-test-capacity */

export function geometricSteps(max, start = 10) {
  if (!Number.isFinite(max) || max < 1) return [];
  const first = Math.max(1, Math.min(start, max));
  const steps = [];
  for (let n = first; n < max; n *= 2) {
    steps.push(n);
  }
  steps.push(max);
  return steps;
}

/** Dernier palier vert `lastGreen`, premier rouge `firstRed`. `null` si la recherche est close. */
export function binarySearchNext(lastGreen, firstRed) {
  if (!Number.isFinite(lastGreen) || !Number.isFinite(firstRed)) return null;
  if (firstRed - lastGreen <= 1) return null;
  return Math.floor((lastGreen + firstRed) / 2);
}

export function recommendedOperating(mix, ratio = 0.7) {
  if (!mix || !Number.isFinite(mix.tables) || mix.tables < 1) return null;
  const tables = Math.max(1, Math.floor(mix.tables * ratio));
  const idlePerTable = mix.tables > 0 ? (mix.idle ?? 0) / mix.tables : 0;
  const idle = Math.floor(tables * idlePerTable);
  const sessionPerTable = mix.tables > 0 ? (mix.usersInSession ?? 0) / mix.tables : 0;
  return {
    tables,
    idle,
    usersInSession: Math.round(tables * sessionPerTable),
    idlePerTable,
  };
}
