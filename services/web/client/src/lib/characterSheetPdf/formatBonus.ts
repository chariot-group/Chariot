/** @see FR-character-sheet-pdf-export */

export function formatSignedBonus(value: number): string {
  if (value >= 0) return `+${value}`;
  return `${value}`;
}

export function formatAbilityModifier(score: number): string {
  return formatSignedBonus(Math.floor((score - 10) / 2));
}
