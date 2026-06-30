/** @see FR-character-sheet-pdf-export */

import type { CharacterSheetPdfTheme } from "@/lib/characterSheetPdf/themes";

export interface CharacterSheetPdfLabels {
  appName: string;
  pageOf: string;
  // Identity
  characterName: string;
  playerName: string;
  race: string;
  classAndLevel: string;
  background: string;
  alignment: string;
  experience: string;
  creatureType: string;
  challengeRating: string;
  // Combat
  armorClass: string;
  initiative: string;
  initiativeShort: string;
  languages: string;
  qrCodeHint: string;
  speed: string;
  maxHp: string;
  currentHp: string;
  tempHp: string;
  hitPoints: string;
  hitDice: string;
  hitPointsRoll: string;
  proficiencyBonus: string;
  inspiration: string;
  passivePerception: string;
  deathSaves: string;
  successes: string;
  failures: string;
  // Sections
  abilities: string;
  savingThrows: string;
  skills: string;
  attacksAndSpellcasting: string;
  equipment: string;
  proficienciesAndLanguages: string;
  featuresAndTraits: string;
  appearance: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  alliesAndOrganizations: string;
  backstory: string;
  treasure: string;
  additionalFeatures: string;
  // Spellcasting
  spellcastingClass: string;
  spellcastingAbility: string;
  spellSaveDc: string;
  spellAttackBonus: string;
  spellLevel: string;
  spellName: string;
  attackName: string;
  cantrips: string;
  preparedSpells: string;
  spellSlots: string;
  slotsUsed: string;
  slotsTotal: string;
  // Currency
  cp: string;
  sp: string;
  ep: string;
  gp: string;
  pp: string;
  // Appearance fields
  age: string;
  height: string;
  weight: string;
  eyes: string;
  skin: string;
  hair: string;
  // Abilities
  abilityNames: Record<string, string>;
  abilityAbbr: Record<string, string>;
  skillNames: Record<string, string>;
  yes: string;
  no: string;
}

export interface PdfAbilityRow {
  abbr: string;
  name: string;
  score: number;
  modifier: string;
}

export interface PdfSkillRow {
  name: string;
  abilityAbbr: string;
  bonus: string;
  proficient: boolean;
}

export interface PdfSavingThrowRow {
  abbr: string;
  bonus: string;
  proficient: boolean;
}

export interface PdfAttackRow {
  name: string;
  bonus: string;
  damage: string;
  range: string;
}

export interface PdfAbilityFeature {
  name: string;
  description: string;
}

export interface PdfSpellRow {
  name: string;
  level: number;
  prepared: boolean;
}

export interface PdfSpellcastingBlock {
  className: string;
  ability: string;
  saveDc: string;
  attackBonus: string;
  cantrips: PdfSpellRow[];
  spellsByLevel: Record<number, PdfSpellRow[]>;
  slotsByLevel: Record<number, { used: number; total: number }>;
  isInnate: boolean;
}

export interface CharacterSheetPdfData {
  isPlayer: boolean;
  displayName: string;
  playerName: string;
  raceOrType: string;
  classOrCr: string;
  backgroundOrSubtype: string;
  alignment: string;
  experience: string;
  inspiration: boolean;
  proficiencyBonus: string;
  abilities: PdfAbilityRow[];
  savingThrows: PdfSavingThrowRow[];
  skills: PdfSkillRow[];
  passivePerception: string;
  armorClass: string;
  initiative: string;
  speed: string;
  maxHp: string;
  currentHp: string;
  tempHp: string;
  hitDice: string;
  deathSaveSuccesses: number;
  deathSaveFailures: number;
  attacks: PdfAttackRow[];
  equipment: string;
  treasureText: string;
  currencies: { cp: number; sp: number; ep: number; gp: number; pp: number };
  proficiencies: string;
  languages: string;
  features: PdfAbilityFeature[];
  appearance: {
    age: string;
    height: string;
    weight: string;
    eyes: string;
    skin: string;
    hair: string;
    description: string;
  };
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  alliesAndOrgs: string;
  backstory: string;
  spellcastingBlocks: PdfSpellcastingBlock[];
  hasSpellcasting: boolean;
  avatarDataUrl: string | null;
  qrCodeDataUrl: string | null;
  characterPageUrl: string;
}

export interface ExportCharacterSheetPdfInput {
  data: CharacterSheetPdfData;
  labels: CharacterSheetPdfLabels;
  theme: CharacterSheetPdfTheme;
}
