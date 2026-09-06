/** @see FR-character-sheet-pdf-export — same skill order as `Skills.tsx` */

import type { AbilityScores } from "@/types/character";

export const PDF_SKILL_CONFIG: ReadonlyArray<{
  key: string;
  abilityKey: keyof AbilityScores;
}> = [
  { key: "acrobatics", abilityKey: "dexterity" },
  { key: "arcana", abilityKey: "intelligence" },
  { key: "athletics", abilityKey: "strength" },
  { key: "stealth", abilityKey: "dexterity" },
  { key: "animalHandling", abilityKey: "wisdom" },
  { key: "sleightHand", abilityKey: "dexterity" },
  { key: "history", abilityKey: "intelligence" },
  { key: "intimidation", abilityKey: "charisma" },
  { key: "insight", abilityKey: "wisdom" },
  { key: "investigation", abilityKey: "intelligence" },
  { key: "medicine", abilityKey: "wisdom" },
  { key: "nature", abilityKey: "intelligence" },
  { key: "perception", abilityKey: "wisdom" },
  { key: "persuasion", abilityKey: "charisma" },
  { key: "religion", abilityKey: "intelligence" },
  { key: "performance", abilityKey: "charisma" },
  { key: "survival", abilityKey: "wisdom" },
  { key: "deception", abilityKey: "charisma" },
] as const;

export const ABILITY_KEYS: ReadonlyArray<keyof AbilityScores> = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];
