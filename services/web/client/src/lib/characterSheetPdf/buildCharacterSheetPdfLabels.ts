/** @see FR-character-sheet-pdf-export */

import type { CharacterSheetPdfLabels } from "@/lib/characterSheetPdf/types";

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

export interface BuildCharacterSheetPdfLabelsInput {
  tPdf: TranslateFn;
  tGeneral: TranslateFn;
  tBattle: TranslateFn;
  tEdit: TranslateFn;
  tNpc: TranslateFn;
  tClass: TranslateFn;
  tAlignment: TranslateFn;
  tCommon: TranslateFn;
}

export function buildCharacterSheetPdfLabels(input: BuildCharacterSheetPdfLabelsInput): CharacterSheetPdfLabels {
  const { tPdf, tGeneral, tBattle, tEdit, tNpc, tCommon } = input;

  const abilityNames: Record<string, string> = {};
  const abilityAbbr: Record<string, string> = {};
  for (const key of ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]) {
    abilityNames[key] = tGeneral(`abilities.${key}`);
    abilityAbbr[key] = tGeneral(`abilitiesAbbr.${key}`);
  }

  const skillNames: Record<string, string> = {};
  for (const key of [
    "acrobatics",
    "animalHandling",
    "arcana",
    "athletics",
    "deception",
    "history",
    "intimidation",
    "insight",
    "investigation",
    "medicine",
    "nature",
    "perception",
    "persuasion",
    "religion",
    "performance",
    "sleightHand",
    "stealth",
    "survival",
  ]) {
    skillNames[key] = tGeneral(`skillNames.${key}`);
  }

  return {
    appName: tPdf("appName"),
    pageOf: tPdf("pageOf", { page: "{page}", total: "{total}" }),
    characterName: tGeneral("character"),
    playerName: tPdf("playerName"),
    race: tEdit("race"),
    classAndLevel: tPdf("classAndLevel"),
    background: tGeneral("background"),
    alignment: tEdit("alignment"),
    experience: tEdit("experiencePoints"),
    creatureType: tNpc("typeLabel"),
    challengeRating: tEdit("challengeRating"),
    armorClass: tPdf("armorClass"),
    initiative: tEdit("initiative"),
    initiativeShort: tPdf("initiativeShort"),
    languages: tPdf("languages"),
    qrCodeHint: tPdf("qrCodeHint"),
    speed: tPdf("speed"),
    maxHp: tEdit("maxHP"),
    currentHp: tEdit("currentHP"),
    tempHp: tEdit("tempHP"),
    hitPoints: tBattle("healthPoints"),
    hitDice: tBattle("hitDice"),
    hitPointsRoll: tBattle("hitPointsRoll"),
    proficiencyBonus: tGeneral("proficiencyBonus"),
    inspiration: tPdf("inspiration"),
    passivePerception: tGeneral("passivePerception"),
    deathSaves: tBattle("deathSaves"),
    successes: tBattle("successes").replace(":", "").trim(),
    failures: tBattle("failures").replace(":", "").trim(),
    abilities: tGeneral("characteristics"),
    savingThrows: tGeneral("savingThrows"),
    skills: tGeneral("skills"),
    attacksAndSpellcasting: tPdf("attacksAndSpellcasting"),
    equipment: tPdf("equipment"),
    proficienciesAndLanguages: tPdf("proficienciesAndLanguages"),
    senses: tGeneral("senses"),
    tools: tGeneral("tools"),
    weapons: tGeneral("weapons"),
    armors: tGeneral("armors"),
    featuresAndTraits: tGeneral("abilitiesAndTraits"),
    appearance: tPdf("appearance"),
    personalityTraits: tPdf("personalityTraits"),
    ideals: tPdf("ideals"),
    bonds: tPdf("bonds"),
    flaws: tPdf("flaws"),
    alliesAndOrganizations: tPdf("alliesAndOrganizations"),
    backstory: tPdf("backstory"),
    treasure: tPdf("treasure"),
    additionalFeatures: tPdf("additionalFeatures"),
    spellcastingClass: tEdit("className"),
    spellcastingAbility: tEdit("spellcastingAbility"),
    spellSaveDc: tEdit("spellSaveDC"),
    spellAttackBonus: tEdit("spellAttackBonus"),
    spellLevel: tEdit("spellLevelLabel"),
    spellName: tEdit("spellName"),
    attackName: tCommon("name"),
    attackBonusHeader: tPdf("attackBonusShort"),
    attackDamageHeader: tPdf("attackDamageType"),
    proficienciesContinuation: tPdf("proficienciesContinuation"),
    equipmentContinuation: tPdf("equipmentContinuation"),
    cantrips: tPdf("cantrips"),
    preparedSpells: tPdf("preparedSpells"),
    spellSlots: tPdf("spellSlots"),
    slotsUsed: tEdit("slotsUsed"),
    slotsTotal: tEdit("slotsTotal"),
    cp: tEdit("copperPieces"),
    sp: tEdit("silverPieces"),
    ep: tEdit("electrumPieces"),
    gp: tEdit("goldPieces"),
    pp: tEdit("platinumPieces"),
    age: tPdf("age"),
    height: tPdf("height"),
    weight: tPdf("weight"),
    eyes: tPdf("eyes"),
    skin: tPdf("skin"),
    hair: tPdf("hair"),
    abilityNames,
    abilityAbbr,
    skillNames,
    yes: tCommon("yes"),
    no: tCommon("no"),
  };
}
