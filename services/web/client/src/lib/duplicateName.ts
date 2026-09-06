/**
 * Shared duplicate-name helpers for characters and groups.
 * @see FR-character-duplicate
 * @see FR-group-duplicate
 */

/** Trailing ` N` where N is a positive integer (e.g. "test 2" → stem "test", suffix 2). */
export function parseDuplicateNameParts(name: string): { stem: string; suffix: number | null } {
  const trimmed = name.trim();
  if (!trimmed) return { stem: "", suffix: null };

  const match = trimmed.match(/^(.*)\s+(\d+)$/);
  if (!match) return { stem: trimmed, suffix: null };

  const stem = match[1].trim();
  const suffix = parseInt(match[2], 10);
  if (!Number.isFinite(suffix) || suffix < 1) return { stem: trimmed, suffix: null };

  return { stem, suffix };
}

/**
 * Next free copy label for a source display name among already-used names.
 * Always starts at suffix 2 and fills the first gap (`test` → `test 2`; with `test 2` taken → `test 3`).
 * Source names that already end with a number (`test 2`) reuse the same stem (`test`).
 */
export function nextAvailableDuplicateName(sourceName: string, existingNames: readonly string[]): string {
  const { stem } = parseDuplicateNameParts(sourceName.trim());
  const occupied = new Set(
    existingNames.map((n) => n.trim()).filter((n) => n.length > 0),
  );

  let n = 2;
  while (n < 10_000) {
    const candidate = stem ? `${stem} ${n}` : String(n);
    if (!occupied.has(candidate)) return candidate;
    n += 1;
  }

  return stem ? `${stem} ${n}` : String(n);
}

/**
 * Builds `count` sequential copy names from the dialog value.
 * - `"test 2"` + count 3 → `["test 2", "test 3", "test 4"]`
 * - `"Hero"` + count 3 → `["Hero", "Hero 2", "Hero 3"]`
 */
export function buildSequentialCopyNames(proposedName: string, count: number): string[] {
  const trimmed = proposedName.trim();
  const safeCount = Math.max(1, Math.min(99, count));
  const { stem, suffix } = parseDuplicateNameParts(trimmed);

  if (suffix === null) {
    return Array.from({ length: safeCount }, (_, i) => {
      if (i === 0) return trimmed;
      return stem ? `${stem} ${i + 1}` : String(i + 1);
    });
  }

  return Array.from({ length: safeCount }, (_, i) => {
    const n = suffix + i;
    return stem ? `${stem} ${n}` : String(n);
  });
}

export function characterDisplayName(character: {
  firstname: string;
  lastname?: string;
} | null): string {
  if (!character) return "";
  return [character.firstname, character.lastname]
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean)
    .join(" ");
}
