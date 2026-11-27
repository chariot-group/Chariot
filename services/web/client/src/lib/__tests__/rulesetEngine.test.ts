import { describe, expect, it } from "vitest";
import { evaluateBuilder } from "@/lib/rulesetEngine/engine";
import type {
  BuilderAnswers,
  BuilderEvaluation,
  BuilderInput,
  BuilderRuleset,
  RulesetEntry,
} from "@/lib/rulesetEngine/types";
import { fixtureEntries, fixtureRuleset } from "@/lib/__tests__/rulesetEngineFixture";

const creationAnswers: BuilderAnswers = {
  race: "dwarf",
  raceChoices: { "dwarf-subrace": ["hill-dwarf"], "hill-dwarf-language": ["giant"] },
  class: "fighter",
  targetLevel: 1,
  classChoices: { "fighter-skills": ["athletics", "perception"] },
  abilityScores: { method: "standardArray", scores: { strength: 15, constitution: 14, wisdom: 13 } },
};

function evaluate(answers: BuilderAnswers, overrides: Partial<BuilderInput> = {}): BuilderEvaluation {
  return evaluateBuilder({
    ruleset: fixtureRuleset,
    entries: fixtureEntries,
    answers,
    context: { mode: "creation", locale: "fr" },
    ...overrides,
  });
}

const page = (result: BuilderEvaluation, key: string) => result.pages.find((candidate) => candidate.key === key);
const field = (result: BuilderEvaluation, pageKey: string, fieldId: string) =>
  page(result, pageKey)?.fields.find((candidate) => candidate.id === fieldId);
const errors = (result: BuilderEvaluation) => result.issues.filter((issue) => issue.severity === "error");

describe("evaluateBuilder — FR-ruleset-character-builder (builder engine, stage 1)", () => {
  it("nominal: a level-1 creation gives complete pages, the state and the projected sheet in the user's locale", () => {
    const result = evaluate(creationAnswers);

    expect(result.pages.map((candidate) => candidate.key)).toEqual(["race", "class", "abilities", "summary"]);
    expect(result.pages.every((candidate) => candidate.complete)).toBe(true);
    expect(errors(result)).toEqual([]);
    expect(page(result, "race")?.title).toBe("Peuple");

    expect(result.state.abilityBonuses).toEqual({ constitution: 2, wisdom: 1 });
    expect(result.state.skills).toEqual({ athletics: 2, perception: 2 });
    expect(result.state.languages).toEqual(["common", "dwarvish", "giant"]);
    expect((result.state.selected as Record<string, unknown[]>).subrace).toHaveLength(1);

    expect(result.sheet).toEqual({
      profile: { race: "Nain", subrace: "Nain des collines" },
      stats: {
        abilityScores: { strength: 15, constitution: 16 },
        languages: ["Commun", "Nain", "Géant"],
        masteries: { athletics: 2 },
        masteriesAbility: { strength: true },
        maxHitPoints: 13,
      },
      progression: { level: 1 },
    });
  });

  it("nominal: grants show their options and the chosen keys, chained grants included", () => {
    const result = evaluate(creationAnswers);
    const grants = field(result, "race", "raceChoices")?.grants ?? [];

    expect(grants.map((grant) => grant.id)).toEqual(["dwarf-subrace", "hill-dwarf-language"]);
    expect(grants[1]).toMatchObject({ ownerKey: "hill-dwarf", expectedCount: 1, chosen: ["giant"] });
    expect(grants[1].options.map((option) => option.label)).toEqual(["Elfique", "Géant"]);
  });

  it("edge: a repeated step expands one page per level and a repeated field reads as an array elsewhere", () => {
    const result = evaluate({ ...creationAnswers, targetLevel: 5, hitPoints: { "2": 6, "3": 7, "4": 5, "5": 8 } });

    expect(result.pages.map((candidate) => candidate.key)).toEqual([
      "race",
      "class",
      "abilities",
      "level-up:2",
      "level-up:3",
      "level-up:4",
      "level-up:5",
      "summary",
    ]);
    expect(page(result, "level-up:3")?.title).toBe("Niveau 3");
    expect(field(result, "level-up:4", "levelClass")?.value).toBe("fighter");
    // 10 + CON modifier (+3) + 6 + 7 + 5 + 8
    expect(result.formulas.maxHitPoints).toBe(39);
    expect((result.state.entries as Record<string, unknown[]>).levelClass).toHaveLength(4);
  });

  it("edge: a page sees the state of the previous pages but not of the next ones", () => {
    const result = evaluate(creationAnswers);

    expect(field(result, "race", "racePageClass")?.value).toBe("none");
    expect(field(result, "class", "classPageConstitutionBonus")?.value).toBe(2);
  });

  it("edge: an overridden suggestion stays in effect, a locked computed value does not", () => {
    const answers = { ...creationAnswers, targetLevel: 2, hitPoints: { "2": 9 }, classPageConstitutionBonus: 7 };
    const result = evaluate({ ...answers, race: "elf", raceChoices: { "elf-subrace": ["high-elf"] } });

    const hitPoints = field(result, "level-up:2", "hitPoints");
    // CON 14 without the dwarf bonus: the suggestion changes, the player's 9 is kept.
    expect(hitPoints).toMatchObject({ suggestion: 7, value: 9, answered: true });
    expect(field(result, "class", "classPageConstitutionBonus")?.value).toBe(0);
  });

  it("edge: changing the race drops the dependent choices and their effects", () => {
    const result = evaluate({ ...creationAnswers, race: "elf" });

    expect(result.state.abilityBonuses).toEqual({ strength: 1 });
    expect(result.state.languages).toBeUndefined();
    expect(result.sheet.profile).toEqual({ race: "Elfe" });
    expect(field(result, "race", "raceChoices")?.grants?.map((grant) => grant.id)).toEqual(["elf-subrace"]);
  });

  it("edge: the choices of a grant no longer offered are signalled as dropped (warning), not applied", () => {
    const result = evaluate({ ...creationAnswers, race: "elf" });
    const dropped = result.issues.filter((issue) => issue.code === "answer-dropped");

    expect(dropped).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldId: "raceChoices", grantId: "dwarf-subrace", severity: "warning" }),
        expect.objectContaining({ fieldId: "raceChoices", grantId: "hill-dwarf-language", severity: "warning" }),
      ]),
    );
    expect(field(result, "race", "raceChoices")?.value).not.toHaveProperty("dwarf-subrace");
    expect(page(result, "race")?.complete).toBe(true);
    // Nominal: grants still offered do not warn; an explicit `[]` for a grant no longer offered is not a choice.
    expect(evaluate(creationAnswers).issues.some((issue) => issue.code === "answer-dropped")).toBe(false);
    const cleared = evaluate({ ...creationAnswers, race: "elf", raceChoices: { "dwarf-subrace": [] } });
    expect(cleared.issues.some((issue) => issue.code === "answer-dropped")).toBe(false);
  });

  it("edge: a count not reached is a warning, not an error", () => {
    const result = evaluate({ ...creationAnswers, classChoices: { "fighter-skills": ["athletics"] } });

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "count-not-reached", severity: "warning", grantId: "fighter-skills" }),
    );
    expect(page(result, "class")?.complete).toBe(true);
  });

  it("edge: levelUp mode only shows the new level pages and replays the saved answers", () => {
    const savedAnswers = { ...creationAnswers, targetLevel: 4, hitPoints: { "2": 6, "3": 6, "4": 6 } };
    const result = evaluateBuilder({
      ruleset: fixtureRuleset,
      entries: fixtureEntries,
      savedAnswers,
      answers: { hitPoints: { "5": 8 } },
      context: { mode: "levelUp", locale: "en", currentLevel: 4, targetLevel: 5 },
    });

    expect(result.pages.map((candidate) => candidate.key)).toEqual(["level-up:5", "summary"]);
    expect(result.state.abilityBonuses).toEqual({ constitution: 2, wisdom: 1 });
    expect(result.formulas.characterLevel).toBe(5);
    // 10 + 3 + 6 + 6 + 6 + 8
    expect(result.formulas.maxHitPoints).toBe(39);
  });

  it("failure: an unknown entry key and a failed validation are errors, without throwing", () => {
    const result = evaluate({ ...creationAnswers, race: "orc", targetLevel: 25 });

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "unknown-entry", severity: "error", fieldId: "race" }),
    );
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "required", fieldId: "race" }));
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "validation-failed", severity: "error", fieldId: "targetLevel" }),
    );
    expect(page(result, "race")?.complete).toBe(false);
  });

  it("failure: dice roll without the six entered results stays incomplete and nothing is generated", () => {
    const result = evaluate({ ...creationAnswers, abilityScores: { method: "roll", scores: { strength: 12 } } });

    expect(field(result, "abilities", "abilityScores")?.value).toEqual({ method: "roll", strength: 12 });
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "allocation-incomplete", severity: "error" }));
    // Missing scores fall back to the formula default, no random value.
    expect(result.formulas.constitution).toBe(12);
  });

  it("failure: an unevaluable expression and a state that never stabilises are errors, without throwing", () => {
    const ruleset: BuilderRuleset = {
      key: "broken",
      version: 1,
      flow: {
        steps: [
          {
            id: "only",
            order: 1,
            title: { en: "Only" },
            breadcrumb: { en: "Only" },
            modes: ["creation"],
            fields: [
              { id: "pick", type: "entitySelect", label: { en: "Pick" }, source: { type: "thing" } },
              { id: "logged", type: "text", label: { en: "Logged" }, visibleWhen: { log: "hello" } },
            ],
          },
        ],
      },
      formulas: [{ id: "broken", expression: { "/": [1, 0] } }],
    };
    const entries = [
      {
        type: "thing",
        key: "flip",
        label: { en: "Flip" },
        effects: [{ op: "set" as const, target: "flag", value: true, when: { "!": [{ var: "state.flag" }] } }],
      },
    ];

    const result = evaluateBuilder({
      ruleset,
      entries,
      answers: { pick: "flip" },
      context: { mode: "creation", locale: "en" },
    });

    expect(result.issues).toContainEqual(expect.objectContaining({ code: "expression-error", fieldId: "logged" }));
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "expression-error", formulaId: "broken" }));
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "unstable-state", stepId: "only" }));
    expect(result.formulas.broken).toBeNull();
  });
});

describe("evaluateBuilder — grant keys (repeatable options on one page)", () => {
  const ruleset: BuilderRuleset = {
    key: "repeat",
    version: 1,
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
            { id: "classChoices", type: "grantedChoices", label: { en: "Choices" }, from: "class" },
          ],
        },
      ],
    },
  };
  const improvement = { id: "improvement", kind: "choose" as const, from: { type: "improvement" }, count: 1 };
  const entries: RulesetEntry[] = [
    {
      type: "class",
      key: "hero",
      label: { en: "Hero" },
      grants: [
        { ...improvement, id: "asi-4" },
        { ...improvement, id: "asi-8" },
      ],
    },
    {
      type: "improvement",
      key: "feat",
      label: { en: "A feat" },
      grants: [{ id: "feat-choice", kind: "choose", from: { type: "feat" }, count: 1 }],
    },
    { type: "feat", key: "lucky", label: { en: "Lucky" } },
  ];

  it("edge: the same grant offered twice on a page gets two distinct keys", () => {
    const result = evaluateBuilder({
      ruleset,
      entries,
      answers: { class: "hero", classChoices: { "asi-4": ["feat"], "asi-8": ["feat"] } },
      context: { mode: "creation", locale: "en" },
    });
    const grants = result.pages[0].fields.find((field) => field.id === "classChoices")?.grants ?? [];
    const featChoices = grants.filter((grant) => grant.id === "feat-choice");

    expect(featChoices).toHaveLength(2);
    expect(new Set(grants.map((grant) => grant.key)).size).toBe(grants.length);
  });
});

describe("evaluateBuilder — obvious choices are suggested (FR-ruleset-character-builder)", () => {
  const ruleset: BuilderRuleset = {
    key: "obvious",
    version: 1,
    flow: {
      steps: [
        {
          id: "race",
          order: 1,
          title: { en: "Race" },
          breadcrumb: { en: "Race" },
          modes: ["creation"],
          fields: [
            { id: "race", type: "entitySelect", label: { en: "Race" }, source: { type: "race" } },
            { id: "raceChoices", type: "grantedChoices", label: { en: "Race choices" }, from: "race" },
          ],
        },
      ],
    },
  };
  const entries: RulesetEntry[] = [
    {
      type: "race",
      key: "orc",
      label: { en: "Orc" },
      grants: [
        {
          id: "orc-languages",
          kind: "choose",
          label: { en: "Languages", fr: "Langues" },
          from: { type: "language", keys: ["common", "orcish"] },
          count: 2,
          effects: [{ op: "grant", target: "languages", value: ["{key}"] }],
        },
        { id: "orc-skill", kind: "choose", from: { type: "skill" }, count: 1, default: ["intimidation"] },
        { id: "orc-tool", kind: "choose", from: { type: "tool" }, count: 1 },
      ],
    },
    { type: "language", key: "common", label: { en: "Common" } },
    { type: "language", key: "orcish", label: { en: "Orcish" } },
    { type: "skill", key: "intimidation", label: { en: "Intimidation" } },
    { type: "skill", key: "athletics", label: { en: "Athletics" } },
    { type: "tool", key: "smith", label: { en: "Smith" } },
    { type: "tool", key: "mason", label: { en: "Mason" } },
  ];
  const run = (answers: BuilderAnswers) =>
    evaluateBuilder({ ruleset, entries, answers, context: { mode: "creation", locale: "fr" } });
  const grantsOf = (result: BuilderEvaluation) =>
    result.pages[0].fields.find((field) => field.id === "raceChoices")?.grants ?? [];

  it("nominal: a single option and a grant with as many options as its count are pre-selected, with effects", () => {
    const result = run({});
    const [languages, skill, tool] = grantsOf(result);

    expect(result.pages[0].fields[0]).toMatchObject({ value: "orc", suggestion: "orc", answered: false });
    expect(languages).toMatchObject({ label: "Langues", chosen: ["common", "orcish"], suggested: true });
    expect(skill).toMatchObject({ chosen: ["intimidation"], suggested: true });
    expect(tool).toMatchObject({ chosen: [], suggested: false });
    expect(result.state.languages).toEqual(["common", "orcish"]);
  });

  it("edge: unchecking every suggested option is an explicit empty answer", () => {
    const result = run({ race: "orc", raceChoices: { "orc-languages": [] } });

    expect(grantsOf(result)[0]).toMatchObject({ chosen: [], suggested: false });
    expect(result.state.languages).toBeUndefined();
  });

  it("failure guard: a default naming an option outside the grant is ignored", () => {
    const withBadDefault = entries.map((entry) =>
      entry.key === "orc"
        ? {
            ...entry,
            grants: [
              { id: "orc-skill", kind: "choose" as const, from: { type: "skill" }, count: 1, default: ["smith"] },
            ],
          }
        : entry,
    );
    const result = evaluateBuilder({
      ruleset,
      entries: withBadDefault,
      answers: {},
      context: { mode: "creation", locale: "en" },
    });

    expect(grantsOf(result)[0]).toMatchObject({ chosen: [], suggested: false });
  });
});
