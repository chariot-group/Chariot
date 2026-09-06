export const SPELL_SCHOOLS = [
  "abjuration",
  "conjuration",
  "divination",
  "enchantment",
  "evocation",
  "illusion",
  "necromancy",
  "transmutation",
] as const;

export type SpellSchool = (typeof SPELL_SCHOOLS)[number];

export function spellSchoolTranslationKey(spellSchool: SpellSchool): string {
  return spellSchool;
}

/** Slugs sent to Codex `/spells` as `schools` query param. */
export function spellSchoolApiValue(spellSchool: string): string {
  return spellSchool.trim().toLowerCase();
}
