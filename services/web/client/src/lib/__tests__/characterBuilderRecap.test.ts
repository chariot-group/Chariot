import { describe, expect, it } from "vitest";
import { groupPageFields } from "@/lib/characterBuilder/pageLayout";
import { pageRecap, summaryAbilities } from "@/lib/characterBuilder/summaryRecap";
import { evaluateBuilder } from "@/lib/rulesetEngine/engine";
import type { BuilderRuleset } from "@/lib/rulesetEngine/types";
import { fixtureEntries, fixtureRuleset } from "@/lib/__tests__/rulesetEngineFixture";

/**
 * Summary cards (one per page) and step cards grouping fields.
 * @see FR-ruleset-character-builder — Web builder UI (Fields: summary, Layout)
 */

const ruleset: BuilderRuleset = {
  ...fixtureRuleset,
  flow: {
    steps: fixtureRuleset.flow.steps.map((step) =>
      step.id === "class"
        ? {
            ...step,
            cards: [
              {
                id: "classAndLevel",
                title: { en: "Class and level", fr: "Classe et niveau" },
                description: { en: "Your class", fr: "Ta classe" },
                fields: ["class", "targetLevel"],
              },
            ],
          }
        : step,
    ),
  },
};
const evaluate = (answers: Record<string, unknown>) =>
  evaluateBuilder({ ruleset, entries: fixtureEntries, answers, context: { mode: "creation", locale: "fr" } });
const label = (key: string) => `#${key}`;

describe("summary recap — one card per page", () => {
  it("nominal: chosen options, grant choices and values become label / value rows", () => {
    const result = evaluate({
      race: "dwarf",
      raceChoices: { "dwarf-subrace": ["hill-dwarf"], "hill-dwarf-language": ["giant"] },
      class: "fighter",
      targetLevel: 2,
      classChoices: { "fighter-skills": ["athletics", "perception"] },
    });
    const page = (key: string) => result.pages.find((candidate) => candidate.key === key)!;

    expect(pageRecap(page("race"), label)).toEqual([
      { key: "race", label: "Peuple", value: "Nain" },
      expect.objectContaining({ label: "Race choices", value: "Nain des collines" }),
      expect.objectContaining({ label: "Race choices", value: "Géant" }),
      { key: "racePageClass", label: "Class seen", value: "none" },
    ]);
    expect(pageRecap(page("class"), label)).toEqual(
      expect.arrayContaining([
        { key: "class", label: "Classe", value: "Guerrier" },
        { key: "targetLevel", label: "Level", value: "2" },
        expect.objectContaining({ value: "Athlétisme, Perception" }),
      ]),
    );
  });

  it("edge: a page without answer gives no row; without declared totals the allocation shows the base only", () => {
    const result = evaluate({ race: "elf", abilityScores: { method: "standardArray", scores: { strength: 15 } } });
    const abilities = result.pages.find((candidate) => candidate.key === "abilities")!;

    expect(pageRecap(abilities, label)).toEqual([
      { key: "abilityScores", label: "Ability scores", value: "#strength 15" },
      { key: "strengthTotal", label: "Strength", value: "16" },
    ]);
    expect(
      pageRecap(
        result.pages.find((candidate) => candidate.key === "summary")!,
        label,
      ),
    ).toEqual([]);
  });

  it("nominal: with declared totals the allocation shows base → total and the total row is merged", () => {
    const withTotals: BuilderRuleset = {
      ...ruleset,
      flow: {
        steps: ruleset.flow.steps.map((step) => ({
          ...step,
          fields: step.fields.map((field) =>
            field.type === "abilityAllocation"
              ? { ...field, config: { ...field.config, totals: { strength: "strengthTotal" } } }
              : field,
          ),
        })),
      },
    };
    const result = evaluateBuilder({
      ruleset: withTotals,
      entries: fixtureEntries,
      answers: { race: "elf", abilityScores: { method: "standardArray", scores: { strength: 15 } } },
      context: { mode: "creation", locale: "fr" },
    });

    expect(
      pageRecap(
        result.pages.find((candidate) => candidate.key === "abilities")!,
        label,
      ),
    ).toEqual([{ key: "abilityScores", label: "Ability scores", value: "#strength 15 → 16" }]);
  });

  it("failure guard: an option missing from the field options falls back to the catalog label", () => {
    const result = evaluate({ race: "dwarf" });
    const race = result.pages.find((candidate) => candidate.key === "race")!;
    const withoutOptions = { ...race, fields: race.fields.map((field) => ({ ...field, options: [] })) };

    expect(pageRecap(withoutOptions, label)[0]).toEqual({ key: "race", label: "Peuple", value: "#dwarf" });
  });
});

describe("step cards — fields grouped under one title", () => {
  it("nominal: the card groups its fields at the place of its first field, other fields stand alone", () => {
    const page = evaluate({}).pages.find((candidate) => candidate.key === "class")!;

    expect(page.cards).toEqual([
      { id: "classAndLevel", title: "Classe et niveau", description: "Ta classe", fields: ["class", "targetLevel"] },
    ]);
    expect(
      groupPageFields(page).map((group) => [group.card?.id ?? null, group.fields.map((field) => field.id)]),
    ).toEqual([
      ["classAndLevel", ["class", "targetLevel"]],
      [null, ["classChoices"]],
      [null, ["classPageConstitutionBonus"]],
    ]);
  });

  it("edge: a page without cards keeps one group per field", () => {
    const page = evaluate({}).pages.find((candidate) => candidate.key === "race")!;

    expect(groupPageFields(page)).toHaveLength(page.fields.length);
  });
});

describe("summary abilities — read from the ruleset, not written in code", () => {
  it("nominal: the abilities of the allocation field config", () => {
    expect(summaryAbilities(evaluate({}).pages)).toEqual(["strength", "constitution", "wisdom"]);
  });

  it("failure guard: a ruleset without allocation field gives no ability", () => {
    const pages = evaluate({}).pages.map((page) => ({
      ...page,
      fields: page.fields.filter((field) => field.type !== "abilityAllocation"),
    }));
    expect(summaryAbilities(pages)).toEqual([]);
  });
});
