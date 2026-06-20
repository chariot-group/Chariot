export const SPELL_CLASSES = [
  "barbarian",
  "bard",
  "cleric",
  "druid",
  "fighter",
  "monk",
  "paladin",
  "ranger",
  "rogue",
  "sorcerer",
  "warlock",
  "wizard",
  "artificer",
] as const;

export type SpellClass = (typeof SPELL_CLASSES)[number];

export function spellClassTranslationKey(spellClass: SpellClass): string {
  return spellClass.charAt(0).toUpperCase() + spellClass.slice(1);
}

/** Valeur attendue par l'API Codex (`Wizard`, `Cleric`, …). */
export function spellClassApiValue(spellClass: string): string {
  return spellClass.charAt(0).toUpperCase() + spellClass.slice(1);
}
