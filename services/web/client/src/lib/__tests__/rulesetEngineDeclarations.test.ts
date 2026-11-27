import { describe, expect, it } from "vitest";
import { evaluateBuilder } from "@/lib/rulesetEngine/engine";
import type { BuilderAnswers, BuilderEvaluation, BuilderRuleset, RulesetEntry } from "@/lib/rulesetEngine/types";
import { fixtureEntries, fixtureRuleset } from "@/lib/__tests__/rulesetEngineFixture";

/**
 * Declarative primitives: entry `values`, `self`, `levels`, `attachments`, `counters`, `collections`, `max`.
 * @see FR-ruleset-character-builder — Declarative primitives (stage 2)
 */

const levelOf = (classKeyPath: string) => ({ var: [{ cat: ["state.classes.of.", { var: classKeyPath }] }, 0] });

const ruleset: BuilderRuleset = {
  ...fixtureRuleset,
  flow: {
    steps: fixtureRuleset.flow.steps.map((step) =>
      step.id !== "level-up"
        ? step
        : {
            ...step,
            fields: [
              {
                ...step.fields[0],
                // Same class again, or a second class whose prerequisites (entry values) both classes meet.
                validation: {
                  or: [
                    { ">": [{ var: [{ cat: ["state.classes.of.", { var: "levelClass" }] }, 0] }, 1] },
                    {
                      and: [
                        { "<=": [{ var: "state.classes.distinct" }, 2] },
                        { var: "state.entries.levelClass.values.multiclassAllowed" },
                        { var: "state.entries.class.values.multiclassAllowed" },
                      ],
                    },
                  ],
                },
              },
              { id: "levelChoices", type: "grantedChoices", label: { en: "Level choices" }, from: "levelClass" },
              {
                id: "pageLanguages",
                type: "computed",
                label: { en: "Languages gained on this page" },
                formula: { var: ["state.page.languages", []] },
              },
              ...step.fields.slice(1),
            ],
          },
    ),
  },
  counters: [{ id: "classes", fields: ["class", "levelClass"] }],
  levels: [
    { type: "class", expression: levelOf("self.key") },
    { type: "subclass", expression: levelOf("self.parentKey") },
  ],
  attachments: [
    { childType: "class-feature", parentType: "class" },
    { childType: "subclass-feature", parentType: "subclass" },
  ],
  collections: [
    {
      id: "sheetAbilities",
      from: { types: ["class-feature", "subclass-feature"] },
      sort: { var: "item.level" },
      item: {
        name: { var: "item.label" },
        "uses.max": { var: "item.values.uses" },
        "uses.reset": { var: "item.data.reset" },
      },
    },
    {
      id: "gear",
      from: { path: "equipment" },
      where: { ">": [{ var: "item.quantity" }, 0] },
      item: { text: { cat: [{ var: "item.quantity" }, " × ", { var: "item.key" }] } },
    },
  ],
};

const t = (en: string) => ({ en });

const entries: RulesetEntry[] = [
  ...fixtureEntries.filter((entry) => entry.type !== "class"),
  {
    type: "class",
    key: "fighter",
    label: t("Fighter"),
    data: { hitDie: 10 },
    values: { multiclassAllowed: { ">=": [{ var: "strength" }, 13] } },
    effects: [
      { op: "set", target: "savingThrows.strength", value: true, when: { "==": [{ var: "self.field" }, "class"] } },
      {
        op: "grant",
        target: "equipment",
        value: [
          { key: "rope", quantity: 1 },
          { key: "torch", quantity: 0 },
        ],
      },
    ],
    grants: [
      {
        id: "fighter-skills",
        kind: "choose",
        from: { type: "skill", keys: ["athletics", "perception", "history"] },
        count: 2,
        when: { "==": [{ var: "self.field" }, "class"] },
        effects: [{ op: "max", target: "skills.{key}", value: 2 }],
      },
      { id: "fighter-subclass", kind: "choose", from: { type: "subclass", parentKey: "fighter" }, count: 1, level: 3 },
      {
        id: "fighter-asi-4",
        kind: "choose",
        from: { type: "language" },
        count: 1,
        level: 4,
        effects: [{ op: "grant", target: "languages", value: ["{key}"] }],
      },
    ],
  },
  {
    type: "class",
    key: "wizard",
    label: t("Wizard"),
    data: { hitDie: 6 },
    values: { multiclassAllowed: { ">=": [{ var: "abilityScores.wisdom" }, 13] } },
    effects: [
      { op: "set", target: "savingThrows.wisdom", value: true, when: { "==": [{ var: "self.field" }, "class"] } },
      { op: "grant", target: "multiclassedInto", value: ["wizard"], when: { "!=": [{ var: "self.field" }, "class"] } },
    ],
  },
  {
    type: "class-feature",
    key: "second-wind",
    parentKey: "fighter",
    level: 1,
    label: t("Second Wind"),
    data: { reset: "short" },
    values: { uses: 1 },
  },
  {
    type: "class-feature",
    key: "action-surge",
    parentKey: "fighter",
    level: 2,
    label: t("Action Surge"),
    data: { reset: "short" },
    values: { uses: { if: [{ ">=": [{ var: "state.classes.of.fighter" }, 17] }, 2, 1] } },
    effects: [{ op: "add", target: "actionSurges", value: 1 }],
  },
  { type: "subclass", key: "champion", parentKey: "fighter", label: t("Champion") },
  {
    type: "subclass-feature",
    key: "improved-critical",
    parentKey: "champion",
    level: 3,
    label: t("Improved Critical"),
    effects: [{ op: "max", target: "skills.athletics", value: 3 }],
  },
  {
    type: "subclass-feature",
    key: "remarkable-athlete",
    parentKey: "champion",
    level: 7,
    label: t("Remarkable Athlete"),
  },
];

const baseAnswers: BuilderAnswers = {
  race: "dwarf",
  raceChoices: { "dwarf-subrace": ["hill-dwarf"], "hill-dwarf-language": ["giant"] },
  class: "fighter",
  classChoices: { "fighter-skills": ["athletics", "perception"] },
  abilityScores: { method: "standardArray", scores: { strength: 15, constitution: 14, wisdom: 13 } },
};

const evaluate = (answers: BuilderAnswers): BuilderEvaluation =>
  evaluateBuilder({ ruleset, entries, answers, context: { mode: "creation", locale: "en" } });

const grantIds = (result: BuilderEvaluation, pageKey: string) =>
  result.pages
    .find((page) => page.key === pageKey)
    ?.fields.find((field) => field.id === "levelChoices")
    ?.grants?.map((grant) => grant.id);

describe("evaluateBuilder — FR-ruleset-character-builder (declarative primitives, stage 2)", () => {
  it("nominal: a counter counts the values chosen across fields up to the current page", () => {
    const result = evaluate({ ...baseAnswers, targetLevel: 3 });

    expect(result.state.classes).toEqual({ keys: ["fighter"], distinct: 1, total: 3, of: { fighter: 3 } });
  });

  it("nominal: children attach when the parent level reaches theirs, grants wait for their level", () => {
    const level1 = evaluate({ ...baseAnswers, targetLevel: 1 });
    expect((level1.state.selected as Record<string, unknown[]>)["class-feature"]).toHaveLength(1);
    expect(level1.state.actionSurges).toBeUndefined();

    const result = evaluate({
      ...baseAnswers,
      targetLevel: 4,
      levelChoices: { "3": { "fighter-subclass": ["champion"] }, "4": { "fighter-asi-4": ["elvish"] } },
    });
    expect(result.state.actionSurges).toBe(1);
    expect(grantIds(result, "level-up:2")).toEqual([]);
    expect(grantIds(result, "level-up:3")).toEqual(["fighter-subclass"]);
    expect(grantIds(result, "level-up:4")).toEqual(["fighter-asi-4"]);
    // The subclass reached level 3 on its own page; its level-7 feature is not attached.
    expect((result.state.selected as Record<string, { key: string }[]>)["subclass-feature"].map((f) => f.key)).toEqual([
      "improved-critical",
    ]);
    expect(result.issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("nominal: collections build sheet-shaped objects from attached entries and from a state list", () => {
    const result = evaluate({
      ...baseAnswers,
      targetLevel: 3,
      levelChoices: { "3": { "fighter-subclass": ["champion"] } },
    });

    expect(result.state.sheetAbilities).toEqual([
      { name: "Second Wind", uses: { max: 1, reset: "short" } },
      { name: "Action Surge", uses: { max: 1, reset: "short" } },
      { name: "Improved Critical" },
    ]);
    expect(result.state.gear).toEqual([{ text: "1 × rope" }]);
  });

  it("edge: state.page only holds what the effects of the current page produced", () => {
    const result = evaluate({ ...baseAnswers, targetLevel: 5, levelChoices: { "4": { "fighter-asi-4": ["elvish"] } } });
    const pageLanguages = (level: number) =>
      result.pages
        .find((page) => page.key === `level-up:${level}`)
        ?.fields.find((field) => field.id === "pageLanguages")?.value;

    expect(pageLanguages(4)).toEqual(["elvish"]);
    expect(pageLanguages(5)).toEqual([]);
    expect(result.state.languages).toEqual(["common", "dwarvish", "giant", "elvish"]);
  });

  it("edge: max keeps the highest mastery whatever the order of the effects", () => {
    const result = evaluate({
      ...baseAnswers,
      targetLevel: 3,
      levelChoices: { "3": { "fighter-subclass": ["champion"] } },
    });

    expect(result.state.skills).toEqual({ athletics: 3, perception: 2 });
  });

  it("edge: self.field tells a first class from a class taken as multiclass", () => {
    const result = evaluate({ ...baseAnswers, targetLevel: 2, levelClass: { "2": "wizard" } });

    expect(result.state.savingThrows).toEqual({ strength: true });
    expect(result.state.multiclassedInto).toEqual(["wizard"]);
    expect(result.state.classes).toMatchObject({
      keys: ["fighter", "wizard"],
      distinct: 2,
      of: { fighter: 1, wizard: 1 },
    });
  });

  it("edge: entry values are evaluated for options and read through state.entries", () => {
    const result = evaluate({ ...baseAnswers, targetLevel: 2, levelClass: { "2": "wizard" } });
    const options = result.pages
      .find((page) => page.key === "class")
      ?.fields.find((field) => field.id === "class")?.options;

    expect(options?.find((option) => option.key === "fighter")?.values).toEqual({ multiclassAllowed: true });
    expect(result.issues.filter((issue) => issue.code === "validation-failed")).toEqual([]);
  });

  it("failure: a second class whose prerequisites are not met fails validation", () => {
    const result = evaluate({
      ...baseAnswers,
      abilityScores: { method: "standardArray", scores: { strength: 15, constitution: 14, wisdom: 12 } },
      targetLevel: 2,
      levelClass: { "2": "wizard" },
    });

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "validation-failed", fieldId: "levelClass", index: 2, severity: "error" }),
    );
  });

  it("failure: a third class is refused by the distinct count", () => {
    const rogue: RulesetEntry = { type: "class", key: "rogue", label: t("Rogue"), values: { multiclassAllowed: true } };
    const result = evaluateBuilder({
      ruleset,
      entries: [...entries, rogue],
      answers: { ...baseAnswers, targetLevel: 3, levelClass: { "2": "wizard", "3": "rogue" } },
      context: { mode: "creation", locale: "en" },
    });

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "validation-failed", fieldId: "levelClass", index: 3 }),
    );
    expect(result.issues).not.toContainEqual(expect.objectContaining({ code: "validation-failed", index: 2 }));
  });
});

describe("evaluateBuilder — FR-ruleset-character-builder (spells and ruleset data, stage 4)", () => {
  const spellRuleset: BuilderRuleset = {
    key: "spells",
    version: 1,
    data: { bonusByLevel: [0, 1, 2] },
    flow: {
      steps: [
        {
          id: "class",
          order: 1,
          title: { en: "Class" },
          breadcrumb: { en: "Class" },
          modes: ["creation"],
          fields: [
            { id: "class", type: "entitySelect", label: { en: "Class" }, source: { type: "class" } },
            {
              id: "classSpells",
              type: "spellSelect",
              label: { en: "Spells" },
              count: 1,
              spellFilter: { className: "arcane-list" },
              spellGroup: { var: "class" },
            },
            { id: "extraSpells", type: "spellSelect", label: { en: "Extra" } },
          ],
        },
        {
          id: "level",
          order: 2,
          title: { en: "Level {repeat.index}" },
          breadcrumb: { en: "Level" },
          modes: ["creation"],
          repeat: { from: 2, to: 3 },
          fields: [
            {
              id: "levelSpells",
              type: "spellSelect",
              label: { en: "New spells" },
              spellFilter: { className: { var: "class" }, maxLevel: { var: ["ruleset.data.bonusByLevel.1", 0] } },
            },
          ],
        },
      ],
    },
    formulas: [{ id: "bonus", expression: { var: [{ cat: ["ruleset.data.bonusByLevel.", 2] }, 0] } }],
  };
  const spellEntries: RulesetEntry[] = [{ type: "class", key: "mage", label: { en: "Mage" } }];
  const spell = (name: string, level: number) => ({ source: "manual" as const, name, level });
  const run = (answers: BuilderAnswers) =>
    evaluateBuilder({
      ruleset: spellRuleset,
      entries: spellEntries,
      answers,
      context: { mode: "creation", locale: "en" },
    });

  it("nominal: chosen spells are grouped by spellGroup, by the evaluated class filter, or by field id", () => {
    const result = run({
      class: "mage",
      classSpells: [spell("Shield", 1)],
      extraSpells: [spell("Light", 0)],
      levelSpells: { "2": [spell("Sleep", 1)], "3": [spell("Misty Step", 2)] },
    });

    expect(result.state.spells).toEqual({
      mage: [spell("Shield", 1), spell("Sleep", 1), spell("Misty Step", 2)],
      extraSpells: [spell("Light", 0)],
    });
  });

  it("edge: ruleset.data is readable in formulas and field expressions, the ruleset key and version too", () => {
    const result = run({ class: "mage" });
    const levelSpells = result.pages.find((page) => page.key === "level:2")?.fields[0];

    expect(result.formulas.bonus).toBe(2);
    expect(levelSpells?.spellFilter).toMatchObject({ className: "mage", maxLevel: 1 });
  });

  it("failure: invalid spells are reported and left out of state.spells", () => {
    const result = run({ class: "mage", classSpells: [spell("Shield", 1), { name: 3 }] });

    expect(result.issues).toContainEqual(expect.objectContaining({ code: "invalid-value", fieldId: "classSpells" }));
    expect(result.state.spells).toEqual({ mage: [spell("Shield", 1)] });
  });
});
