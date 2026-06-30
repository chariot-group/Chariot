/** @see FR-character-sheet-pdf-export — D&D 5e official sheet skill order */

import type { AbilityScores } from "@/types/character";

export const PDF_SKILL_CONFIG: ReadonlyArray<{
  key: string;
  abilityKey: keyof AbilityScores;
}> = [
  { key: "acrobatics", abilityKey: "dexterity" },
  { key: "animalHandling", abilityKey: "wisdom" },
  { key: "arcana", abilityKey: "intelligence" },
  { key: "athletics", abilityKey: "strength" },
  { key: "deception", abilityKey: "charisma" },
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
  { key: "sleightHand", abilityKey: "dexterity" },
  { key: "stealth", abilityKey: "dexterity" },
  { key: "survival", abilityKey: "wisdom" },
] as const;

export const ABILITY_KEYS: ReadonlyArray<keyof AbilityScores> = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];
