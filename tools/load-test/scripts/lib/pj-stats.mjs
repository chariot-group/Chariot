export function pjPerTableStats(tables) {
  const counts = (tables ?? []).map((t) => t.playersCount ?? t.players?.length ?? 0);
  if (counts.length === 0) {
    return { min: 0, max: 0, median: 0, mean: 0, tables: 0 };
  }
  const sorted = [...counts].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median,
    mean: Math.round((sum / sorted.length) * 100) / 100,
    tables: sorted.length,
  };
}

export function usersInSession(tables) {
  return (tables ?? []).reduce(
    (n, t) => n + 1 + (t.playersCount ?? t.players?.length ?? 0),
    0,
  );
}
