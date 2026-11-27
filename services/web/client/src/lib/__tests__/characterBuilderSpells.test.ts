import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  addSpellChoices,
  codexClassFilter,
  codexLevelFilter,
  isOutsideLevelRange,
  readSpellChoices,
  removeSpellChoice,
  replaceSpellChoice,
  toSpellChoice,
} from "@/lib/characterBuilder/spellChoices";
import { buildPlayerDraftFromSheet } from "@/lib/characterBuilder/builderDraft";
import { evaluateBuilder } from "@/lib/rulesetEngine/engine";
import type { BuilderRuleset, RulesetEntry, SpellChoice } from "@/lib/rulesetEngine/types";

/**
 * Spells of the character builder (lot B): Codex or manual choices, counters, level range, draft.
 * @see FR-ruleset-character-builder — Web builder UI (Spells, lot B)
 */

const SEED_DIR = path.resolve(__dirname, "../../../../../adventure/api/src/seeder/rulesets/dnd5e-2014");
const ruleset = JSON.parse(fs.readFileSync(path.join(SEED_DIR, "ruleset.json"), "utf8")) as BuilderRuleset;
const entries = fs
  .readdirSync(path.join(SEED_DIR, "entries"))
  .filter((file) => file.endsWith(".json"))
  .flatMap((file) => JSON.parse(fs.readFileSync(path.join(SEED_DIR, "entries", file), "utf8")) as RulesetEntry[]);

const codex = (name: string, level: number) =>
  toSpellChoice({ name, level, school: "evocation" }, "codex") as SpellChoice;

describe("builder spell choices — FR-ruleset-character-builder (Spells, lot B)", () => {
  it("nominal: a level-1 wizard adds three Codex cantrips and one manual spell; the draft block holds them", () => {
    const cantrips = addSpellChoices([], [codex("Fire Bolt", 0), codex("Mage Hand", 0), codex("Light", 0)]);
    const spells = addSpellChoices([], [toSpellChoice({ name: "Magic Missile", level: 1 }, "manual") as SpellChoice]);
    const result = evaluateBuilder({
      ruleset,
      entries,
      answers: {
        race: "human",
        class: "wizard",
        targetLevel: 1,
        abilityScores: {
          method: "standardArray",
          scores: { strength: 8, dexterity: 14, constitution: 13, intelligence: 15, wisdom: 12, charisma: 10 },
        },
        cantrips,
        spells,
      },
      context: { mode: "creation", locale: "fr" },
    });
    const fields = result.pages.find((page) => page.key === "spells")?.fields ?? [];
    const draft = buildPlayerDraftFromSheet(result.sheet);

    expect(fields.map((field) => [field.id, field.count, field.expectedCount])).toEqual([
      ["cantrips", 3, 3],
      ["spells", 1, 6],
    ]);
    expect(draft.spellcasting?.[0].spells).toHaveLength(4);
    expect(draft.spellcasting?.[0].spells.every((spell) => !("source" in spell))).toBe(true);
    expect(draft.spellcasting?.[0].spells.find((spell) => spell.name === "Magic Missile")).toMatchObject({
      level: 1,
      prepared: true,
    });
  });

  it("edge: the same spell is added once, a removal updates the list, an edit keeps the position", () => {
    const once = addSpellChoices([codex("Shield", 1)], [codex("shield ", 1), codex("Sleep", 1)]);
    const edited = replaceSpellChoice(once, 0, codex("Shield of Faith", 1));

    expect(once.map((spell) => spell.name)).toEqual(["Shield", "Sleep"]);
    expect(removeSpellChoice(once, 0).map((spell) => spell.name)).toEqual(["Sleep"]);
    expect(edited.map((spell) => spell.name)).toEqual(["Shield of Faith", "Sleep"]);
    expect(replaceSpellChoice(once, 0, codex("Sleep", 1))).toEqual(once);
  });

  it("edge: a spell outside the field levels is flagged, Codex filters follow the field", () => {
    const filter = { className: "wizard", minLevel: 1, maxLevel: 1 };

    expect(isOutsideLevelRange(codex("Misty Step", 2), filter)).toBe(true);
    expect(isOutsideLevelRange(codex("Shield", 1), filter)).toBe(false);
    expect(codexClassFilter(filter)).toEqual(["wizard"]);
    expect(codexLevelFilter({ minLevel: 0, maxLevel: 0 })).toBe(0);
    expect(codexLevelFilter({ minLevel: 1, maxLevel: 3 })).toBeNull();
  });

  it("edge: the level typed in the manual form (text) is kept, so an out-of-range spell is flagged", () => {
    const filter = { className: "wizard", minLevel: 1, maxLevel: 1 };
    const typed = toSpellChoice({ name: "Misty Step", level: "2" as unknown as number }, "manual", 1);

    expect(typed).toMatchObject({ name: "Misty Step", level: 2, prepared: true, source: "manual" });
    expect(isOutsideLevelRange(typed!, filter)).toBe(true);
    expect(toSpellChoice({ name: "Light", level: "0" as unknown as number }, "manual", 1)).toMatchObject({ level: 0 });
  });

  it("failure: a spell without name is not added; unknown classes and malformed answers are ignored", () => {
    // An empty, non-integer or out-of-scale level falls back to the field level.
    for (const level of ["", "abc", "2.5", "12", -1]) {
      expect(toSpellChoice({ name: "Shield", level: level as unknown as number }, "manual", 1)?.level).toBe(1);
    }
    expect(toSpellChoice({ name: "  ", level: 1 }, "manual")).toBeNull();
    expect(toSpellChoice({ name: "Light" }, "codex", 0)).toMatchObject({ name: "Light", level: 0, source: "codex" });
    expect(codexClassFilter({ className: "innate" })).toEqual([]);
    expect(readSpellChoices([{ name: "Ok", level: 1 }, { name: 3 }, null, "x"])).toEqual([{ name: "Ok", level: 1 }]);
    expect(readSpellChoices(undefined)).toEqual([]);
  });
});
