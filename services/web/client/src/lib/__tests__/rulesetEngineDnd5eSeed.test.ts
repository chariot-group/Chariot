import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateBuilder } from "@/lib/rulesetEngine/engine";
import type {
  BuilderAnswers,
  BuilderContext,
  BuilderEvaluation,
  BuilderRuleset,
  RulesetEntry,
} from "@/lib/rulesetEngine/types";

/**
 * The generic engine on the real `dnd5e-2014` seed of the adventure service (read from the repository).
 * @see FR-ruleset-character-builder — Engine delivery stages (stage 3)
 */

const SEED_DIR = path.resolve(__dirname, "../../../../../adventure/api/src/seeder/rulesets/dnd5e-2014");
const ruleset = JSON.parse(fs.readFileSync(path.join(SEED_DIR, "ruleset.json"), "utf8")) as BuilderRuleset;
const entries = fs
  .readdirSync(path.join(SEED_DIR, "entries"))
  .filter((file) => file.endsWith(".json"))
  .flatMap((file) => JSON.parse(fs.readFileSync(path.join(SEED_DIR, "entries", file), "utf8")) as RulesetEntry[]);

const fighterAnswers: BuilderAnswers = {
  race: "dwarf",
  raceChoices: { "dwarf-subrace": ["hill-dwarf"] },
  class: "fighter",
  targetLevel: 1,
  classChoices: { "fighter-skills": ["athletics", "perception"], "fighter-fighting-style": ["fighting-style-archery"] },
  abilityScores: {
    method: "standardArray",
    scores: { strength: 15, dexterity: 13, constitution: 14, intelligence: 8, wisdom: 12, charisma: 10 },
  },
  background: "soldier",
  equipmentPack: "fighter-starting-equipment",
  equipmentChoices: { "fighter-equipment-armor": ["fighter-equipment-leather-longbow"] },
  firstname: "Thorin",
  alignment: "lawful-good",
};

const evaluate = (answers: BuilderAnswers, context: Partial<BuilderContext> = {}): BuilderEvaluation =>
  evaluateBuilder({ ruleset, entries, answers, context: { mode: "creation", locale: "fr", ...context } });

const errors = (result: BuilderEvaluation) => result.issues.filter((issue) => issue.severity === "error");
const sheet = (result: BuilderEvaluation) =>
  result.sheet as {
    profile: Record<string, unknown>;
    class: Record<string, unknown>[];
    stats: Record<string, Record<string, unknown> & unknown>;
    abilities: { name: string; counterMax?: number; counterResetsOnShortRest?: boolean }[];
    actions: Record<string, unknown>[];
    treasure: { equipment: string };
    progression: Record<string, unknown>;
  };
const levelGrants = (result: BuilderEvaluation, level: number) =>
  result.pages
    .find((page) => page.key === `level-up:${level}`)
    ?.fields.find((field) => field.id === "levelChoices")
    ?.grants?.map((grant) => grant.id);

describe("dnd5e-2014 seed on the generic engine — FR-ruleset-character-builder (stage 3)", () => {
  it("nominal: a level-1 Hill Dwarf Fighter projects a complete sheet in the user's locale", () => {
    const result = evaluate(fighterAnswers);
    const { profile, stats, abilities, actions, treasure, progression } = sheet(result);

    expect(errors(result)).toEqual([]);
    expect(profile).toMatchObject({ race: "Nain", subrace: "Nain des collines", history: "Soldat" });
    expect(stats.abilityScores).toMatchObject({ constitution: 16, wisdom: 13 });
    expect(stats.masteriesAbility).toMatchObject({ strength: true, constitution: true, dexterity: false });
    expect(stats.masteries).toMatchObject({ athletics: 2, perception: 2 });
    expect(stats.proficiencyBonus).toBe(2);
    // 10 (hit die) + 3 (CON 16) + 1 (hill dwarf toughness)
    expect(stats.maxHitPoints).toBe(14);
    expect(sheet(result).class).toEqual([{ name: "Fighter", level: 1, hitDice: 10, hitDiceRemaining: 1 }]);
    expect(abilities.find((ability) => ability.name === "Second souffle")).toMatchObject({
      counterMax: 1,
      counterResetsOnShortRest: true,
    });
    expect(abilities.map((ability) => ability.name)).not.toContain("Fougue");
    // Longbow: ranged, DEX 13 (+1) + proficiency 2
    expect(actions).toEqual([
      expect.objectContaining({
        attackAbility: "dexterity",
        attackBonus: 3,
        damage: [expect.objectContaining({ dice: "1d8" })],
      }),
    ]);
    expect(treasure.equipment).toContain("20 × Flèches");
    expect(progression).toEqual({ level: 1, experience: 0 });
  });

  it("edge: a level-5 Fighter gets the subclass grant on page 3 and the ASI grant on page 4", () => {
    const result = evaluate({
      ...fighterAnswers,
      targetLevel: 5,
      levelChoices: { "3": { "fighter-subclass": ["battle-master"] } },
    });

    expect(levelGrants(result, 2)).toEqual([]);
    expect(levelGrants(result, 3)).toEqual(["fighter-subclass", "maneuvers-3", "student-of-war-tool"]);
    expect(levelGrants(result, 4)).toEqual(["fighter-asi-4"]);
    expect(levelGrants(result, 5)).toEqual([]);
    expect(sheet(result).class).toEqual([
      { name: "Fighter", level: 5, hitDice: 10, hitDiceRemaining: 5, subclass: "Maître de guerre" },
    ]);
    expect(sheet(result).progression).toEqual({ level: 5, experience: 6500 });
    expect(errors(result)).toEqual([]);
  });

  it("edge: the same ability score improvement taken at levels 4 and 6 offers its ability choice twice", () => {
    const result = evaluate({
      ...fighterAnswers,
      targetLevel: 6,
      levelChoices: {
        "4": { "fighter-asi-4": ["asi-plus-two"], "asi-plus-two-ability": ["strength"] },
        "6": { "fighter-asi-6": ["asi-plus-two"], "asi-plus-two-ability": ["dexterity"] },
      },
    });

    expect(levelGrants(result, 6)).toEqual(["fighter-asi-6", "asi-plus-two-ability"]);
    expect(sheet(result).stats.abilityScores).toMatchObject({ strength: 17, dexterity: 15 });
  });

  it("edge: a Fighter 4 / Rogue 1 only gets the multiclass proficiencies of the rogue", () => {
    const result = evaluate({ ...fighterAnswers, targetLevel: 5, levelClass: { "5": "rogue" } });
    const { stats } = sheet(result);

    expect(errors(result)).toEqual([]);
    expect(sheet(result).class.map(({ name, level }) => ({ name, level }))).toEqual([
      { name: "Fighter", level: 4 },
      { name: "Rogue", level: 1 },
    ]);
    expect(stats.masteriesAbility).toMatchObject({ dexterity: false, intelligence: false });
    expect(stats.tools).toContain("Outils de voleur");
    expect(
      result.pages
        .find((page) => page.key === "level-up:5")
        ?.fields.find((f) => f.id === "levelChoices")
        ?.grants?.map((g) => g.id),
    ).toContain("rogue-multiclass-skill");
  });

  it("edge: in levelUp mode the saved creation is replayed and only the new level is shown", () => {
    const savedAnswers = { ...fighterAnswers, targetLevel: 4, hitPoints: { "2": 6, "3": 6, "4": 6 } };
    const result = evaluateBuilder({
      ruleset,
      entries,
      savedAnswers,
      answers: { hitPoints: { "5": 9 } },
      context: { mode: "levelUp", locale: "fr", currentLevel: 4, targetLevel: 5 },
    });

    expect(result.pages.map((page) => page.key)).toEqual(["level-up:5", "summary"]);
    expect(sheet(result).class).toEqual([expect.objectContaining({ name: "Fighter", level: 5 })]);
    // 14 at level 1, then 6 + 6 + 6 + 9 and the hill dwarf toughness per level
    expect(sheet(result).stats.maxHitPoints).toBe(14 + 27 + 4);
  });

  it("failure: a second class without 13 in its primary ability is refused", () => {
    const result = evaluate({ ...fighterAnswers, targetLevel: 2, levelClass: { "2": "wizard" } });

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "validation-failed", fieldId: "levelClass", index: 2, severity: "error" }),
    );
  });

  it("failure: a third class is refused", () => {
    const result = evaluate({
      ...fighterAnswers,
      abilityScores: {
        method: "standardArray",
        scores: { strength: 15, dexterity: 13, constitution: 12, intelligence: 14, wisdom: 8, charisma: 10 },
      },
      targetLevel: 3,
      levelClass: { "2": "rogue", "3": "wizard" },
    });

    expect(result.issues).not.toContainEqual(expect.objectContaining({ code: "validation-failed", index: 2 }));
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "validation-failed", fieldId: "levelClass", index: 3 }),
    );
  });
});

describe("dnd5e-2014 spellcasting on the generic engine — FR-ruleset-character-builder (stage 4)", () => {
  const spell = (name: string, level: number) => ({ source: "manual" as const, name, level });
  const scores = (values: number[]) => ({
    method: "standardArray",
    scores: Object.fromEntries(
      ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].map((ability, i) => [
        ability,
        values[i],
      ]),
    ),
  });
  const casterBase: BuilderAnswers = {
    background: "soldier",
    firstname: "Ilyra",
    alignment: "true-neutral",
    race: "human",
  };
  type Block = {
    className: string;
    ability?: string;
    saveDC?: number;
    attackBonus?: number;
    isInnate?: boolean;
    spells: unknown[];
    spellSlotsByLevel?: Record<string, { total: number; used: number }>;
  };
  const blocks = (result: BuilderEvaluation) => (result.sheet.spellcasting ?? []) as Block[];
  const expectedCount = (result: BuilderEvaluation, pageKey: string, fieldId: string) =>
    result.pages.find((page) => page.key === pageKey)?.fields.find((field) => field.id === fieldId)?.expectedCount;

  it("nominal: a level-3 High Elf Wizard gets a wizard block with slots on spell levels only, and an innate block", () => {
    const result = evaluate({
      ...casterBase,
      race: "elf",
      raceChoices: { "elf-subrace": ["high-elf"] },
      class: "wizard",
      targetLevel: 3,
      abilityScores: scores([13, 14, 12, 15, 10, 8]),
      racialCantrip: [spell("Light", 0)],
      cantrips: [spell("Fire Bolt", 0), spell("Mage Hand", 0), spell("Prestidigitation", 0)],
      spells: [spell("Magic Missile", 1), spell("Shield", 1)],
      levelSpells: { "3": [spell("Misty Step", 2)] },
    });

    expect(errors(result)).toEqual([]);
    // INT 15 + 1 (high elf) = 16: +3; proficiency 2
    expect(blocks(result)[0]).toMatchObject({
      className: "Wizard",
      ability: "intelligence",
      saveDC: 13,
      attackBonus: 5,
      spellSlotsByLevel: { "1": { total: 4, used: 0 }, "2": { total: 2, used: 0 } },
    });
    expect(Object.keys(blocks(result)[0].spellSlotsByLevel ?? {})).toEqual(["1", "2"]);
    expect(blocks(result)[0].spells).toHaveLength(6);
    expect(blocks(result)[1]).toMatchObject({ className: "Elfe", isInnate: true, spells: [spell("Light", 0)] });
    expect(expectedCount(result, "spells", "spells")).toBe(6);
  });

  it("nominal: a prepared caster is suggested max(1, modifier + level) spells", () => {
    const result = evaluate({
      ...casterBase,
      class: "cleric",
      targetLevel: 1,
      abilityScores: scores([13, 10, 14, 8, 15, 12]),
    });

    // WIS 15 (no human subrace chosen, so no racial bonus): +2, cleric level 1
    expect(expectedCount(result, "spells", "spells")).toBe(3);
    expect(blocks(result)).toEqual([expect.objectContaining({ className: "Cleric", ability: "wisdom", spells: [] })]);
    expect(blocks(result)[0].spellSlotsByLevel).toBeUndefined();
  });

  it("edge: a Paladin 2 / Sorcerer 3 gets the multiclass slots of caster level 4 on the first block only", () => {
    const result = evaluate({
      ...casterBase,
      class: "paladin",
      targetLevel: 5,
      abilityScores: scores([15, 8, 12, 10, 13, 14]),
      levelClass: { "3": "sorcerer", "4": "sorcerer", "5": "sorcerer" },
      levelSpells: { "2": [spell("Bless", 1)], "5": [spell("Mirror Image", 2)] },
    });

    expect(errors(result)).toEqual([]);
    expect(blocks(result).map((block) => [block.className, block.spellSlotsByLevel])).toEqual([
      ["Paladin", { "1": { total: 4, used: 0 }, "2": { total: 3, used: 0 } }],
      ["Sorcerer", undefined],
    ]);
  });

  it("edge: a Warlock 2 / Sorcerer 1 keeps its pact slots, the sorcerer its own table", () => {
    const result = evaluate({
      ...casterBase,
      class: "warlock",
      targetLevel: 3,
      abilityScores: scores([8, 13, 12, 10, 14, 15]),
      spells: [spell("Hex", 1)],
      levelClass: { "3": "sorcerer" },
      levelSpells: { "3": [spell("Shield", 1)] },
    });

    expect(blocks(result).map((block) => [block.className, block.spellSlotsByLevel])).toEqual([
      ["Warlock", { "1": { total: 2, used: 0 } }],
      ["Sorcerer", { "1": { total: 2, used: 0 } }],
    ]);
  });

  it("edge: a Fighter 3 Eldritch Knight gets a fighter block with INT and 2 level-1 slots", () => {
    const result = evaluate({
      ...fighterAnswers,
      targetLevel: 3,
      abilityScores: scores([15, 13, 14, 12, 10, 8]),
      levelChoices: { "3": { "fighter-subclass": ["eldritch-knight"] } },
      levelCantrips: { "3": [spell("Booming Blade", 0), spell("Light", 0)] },
      levelSpells: { "3": [spell("Shield", 1)] },
    });

    expect(expectedCount(result, "level-up:3", "levelCantrips")).toBe(2);
    expect(expectedCount(result, "level-up:3", "levelSpells")).toBe(3);
    expect(blocks(result)).toEqual([
      expect.objectContaining({
        className: "Fighter",
        ability: "intelligence",
        spellSlotsByLevel: { "1": { total: 2, used: 0 } },
      }),
    ]);
  });

  it("failure: a character without spellcasting class or racial spell gets no spellcasting block", () => {
    const result = evaluate({ ...fighterAnswers, race: "human", raceChoices: {} });

    expect(result.sheet.spellcasting).toEqual([]);
  });
});
