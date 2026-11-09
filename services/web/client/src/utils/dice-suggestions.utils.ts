/** Dice faces proposed while typing a damage formula (d20 / d100 are never damage dice). */
export const DAMAGE_DICE_FACES = ["d4", "d6", "d8", "d10", "d12"] as const;

/** Optional count, then `d`, then optional face digits: `d`, `2d`, `2d1`. */
const DICE_PREFIX_REGEX = /^(\d*)d(\d*)$/i;

/**
 * Dice suggestions for a free-text damage field: only while the value is a dice prefix, the typed count is
 * kept and the faces are filtered by the typed digits (`2d1` → `2d10`, `2d12`). A complete formula with a
 * bonus (`1d6+3`) or any other text gets no suggestion.
 * @see FR-character-list-card
 */
export function getDiceSuggestions(value: string): string[] {
  const match = DICE_PREFIX_REGEX.exec(value.trim());
  if (!match) return [];

  const [, count, faces] = match;
  return DAMAGE_DICE_FACES.filter((die) => die.slice(1).startsWith(faces))
    .map((die) => `${count}${die}`)
    .filter((suggestion) => suggestion.toLowerCase() !== value.trim().toLowerCase());
}
