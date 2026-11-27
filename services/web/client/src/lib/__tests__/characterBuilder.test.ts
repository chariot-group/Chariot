import { describe, expect, it } from "vitest";
import { readFieldAnswer, setFieldAnswer, setGrantAnswer, toggleKey } from "@/lib/characterBuilder/builderAnswers";
import {
  adjacentPageKey,
  buildBreadcrumb,
  builderFieldDomId,
  pageErrorFields,
  diffPageKeys,
  incompletePages,
  resolveCurrentPageKey,
} from "@/lib/characterBuilder/builderNavigation";
import {
  builderStorageKey,
  clearBuilderProgress,
  loadBuilderProgress,
  saveBuilderProgress,
} from "@/lib/characterBuilder/builderProgress";
import {
  availableArrayValues,
  changeAllocationMethod,
  pointBuyRemaining,
  pointBuyValues,
  readAllocationConfig,
} from "@/lib/characterBuilder/abilityAllocation";
import { buildCharacterBuilderRoutes } from "@/lib/characterBuilder/builderRoutes";
import { buildPlayerDraftFromSheet } from "@/lib/characterBuilder/builderDraft";
import type { BuilderEvaluation, EvaluatedPage } from "@/lib/rulesetEngine/types";

const page = (key: string, complete = true, index?: number): EvaluatedPage => ({
  key,
  stepId: key.split(":")[0],
  ...(index !== undefined ? { index } : {}),
  title: key,
  breadcrumb: key,
  fields: [],
  cards: [],
  complete,
});

const evaluation = (pages: EvaluatedPage[], issues: BuilderEvaluation["issues"] = []): BuilderEvaluation => ({
  pages,
  state: {},
  formulas: {},
  sheet: {},
  issues,
});

const memoryStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    data,
  };
};

describe("builder answers — FR-ruleset-character-builder (Web builder UI)", () => {
  it("nominal: sets a field answer and a repeated-page answer by index", () => {
    const answers = setFieldAnswer(setFieldAnswer({}, "race", undefined, "dwarf"), "hitPoints", 3, 7);

    expect(answers).toEqual({ race: "dwarf", hitPoints: { "3": 7 } });
    expect(readFieldAnswer(answers, "hitPoints", 3)).toBe(7);
  });

  it("edge: clearing the last repeated answer removes the field, grants are kept per id", () => {
    const answers = setFieldAnswer({ hitPoints: { "3": 7 } }, "hitPoints", 3, undefined);
    const grants = setGrantAnswer(
      setGrantAnswer({}, "classChoices", undefined, "skills", ["a", "b"]),
      "classChoices",
      undefined,
      "style",
      ["x"],
    );

    expect(answers).toEqual({});
    expect(grants).toEqual({ classChoices: { skills: ["a", "b"], style: ["x"] } });
    // Unchecking everything is an explicit answer: the suggested choice must not come back.
    expect(setGrantAnswer(grants, "classChoices", undefined, "style", [])).toEqual({
      classChoices: { skills: ["a", "b"], style: [] },
    });
    expect(toggleKey(["a"], "b", true)).toEqual(["a", "b"]);
    expect(toggleKey(["a", "b"], "a", false)).toEqual(["b"]);
  });

  it("failure guard: never mutates the previous answers", () => {
    const previous = { hitPoints: { "2": 6 } };
    setFieldAnswer(previous, "hitPoints", 3, 8);

    expect(previous).toEqual({ hitPoints: { "2": 6 } });
  });
});

describe("builder navigation — FR-ruleset-character-builder (Pages and breadcrumb)", () => {
  const pages = [page("race"), page("class", false), page("level-up:2", true, 2), page("summary")];

  it("nominal: breadcrumb states, only visited pages are reachable", () => {
    const steps = buildBreadcrumb(
      evaluation(pages, [{ code: "required", severity: "error", stepId: "class", fieldId: "class" }]),
      "level-up:2",
      ["race", "class"],
    );

    expect(steps.map((step) => [step.key, step.state, step.reachable, step.errorCount])).toEqual([
      ["race", "complete", true, 0],
      ["class", "error", true, 1],
      ["level-up:2", "current", true, 0],
      ["summary", "unvisited", false, 0],
    ]);
  });

  it("edge: a removed current page falls back to the page now at its position", () => {
    const before = ["race", "class", "level-up:2", "level-up:3", "summary"];
    const after = [page("race"), page("class"), page("level-up:2", true, 2), page("summary")];

    expect(resolveCurrentPageKey(after, "level-up:3", before)).toBe("summary");
    expect(resolveCurrentPageKey(after, "class", before)).toBe("class");
    expect(resolveCurrentPageKey(after, null)).toBe("race");
    expect(
      diffPageKeys(
        before,
        after.map((p) => p.key),
      ),
    ).toEqual({ added: [], removed: ["level-up:3"] });
  });

  it("failure: incomplete pages block the end, no page beyond the edges", () => {
    expect(incompletePages(evaluation(pages)).map((p) => p.key)).toEqual(["class"]);
    expect(adjacentPageKey(pages, "summary", "next")).toBeNull();
    expect(adjacentPageKey(pages, "race", "previous")).toBeNull();
    expect(adjacentPageKey(pages, "race", "next")).toBe("class");
  });
});

describe("builder progress — FR-ruleset-character-builder (session storage)", () => {
  const progress = { rulesetId: "r1", answers: { race: "elf" }, pageKey: "class", visited: ["race", "class"] };

  it("nominal: saves and resumes the progress of a route", () => {
    const storage = memoryStorage();
    saveBuilderProgress(storage, "player-space", progress);

    expect(loadBuilderProgress(storage, "player-space")).toEqual(progress);
    expect(loadBuilderProgress(storage, "group:g1")).toBeNull();
  });

  it("edge: clearing removes the saved progress", () => {
    const storage = memoryStorage();
    saveBuilderProgress(storage, "player-space", progress);
    clearBuilderProgress(storage, "player-space");

    expect(storage.data.size).toBe(0);
  });

  it("failure: malformed or unreadable progress is ignored, storage errors never throw", () => {
    const storage = memoryStorage();
    storage.setItem(builderStorageKey("player-space"), "{not json");
    expect(loadBuilderProgress(storage, "player-space")).toBeNull();
    storage.setItem(builderStorageKey("player-space"), JSON.stringify({ rulesetId: 3 }));
    expect(loadBuilderProgress(storage, "player-space")).toBeNull();

    const throwing = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    expect(loadBuilderProgress(throwing, "x")).toBeNull();
    expect(() => saveBuilderProgress(throwing, "x", progress)).not.toThrow();
    expect(() => clearBuilderProgress(throwing, "x")).not.toThrow();
  });
});

describe("ability allocation UI — FR-ruleset-character-builder (Fields)", () => {
  const config = readAllocationConfig({
    abilities: ["strength", "dexterity", "constitution"],
    pointBuy: { budget: 27, costs: { "8": 0, "13": 5, "15": 9 } },
    standardArray: [15, 14, 13],
  });

  it("nominal: point buy shows the remaining points", () => {
    expect(pointBuyRemaining(config.pointBuy, { strength: 15, dexterity: 13, constitution: null })).toBe(13);
    expect(pointBuyValues(config.pointBuy)).toEqual([8, 13, 15]);
  });

  it("edge: a standard-array value can only be used once, the ability keeps its own value", () => {
    const scores = { strength: 15, dexterity: 14, constitution: null };

    expect(availableArrayValues(config.standardArray ?? [], scores, "constitution")).toEqual([13]);
    expect(availableArrayValues(config.standardArray ?? [], scores, "strength")).toEqual([15, 13]);
  });

  it("failure guard: changing the method drops the scores of the previous method", () => {
    expect(changeAllocationMethod({ method: "pointBuy", scores: { strength: 15 } }, "roll")).toEqual({
      method: "roll",
      scores: {},
    });
    expect(readAllocationConfig(undefined)).toEqual({
      abilities: [],
      totals: {},
      pointBuy: undefined,
      standardArray: undefined,
      roll: undefined,
    });
    expect(pointBuyRemaining(undefined, {})).toBeNull();
  });
});

describe("builder routes and draft — FR-ruleset-character-builder (Entry point, End of the builder)", () => {
  it("nominal: Player space routes and a draft without group", () => {
    expect(buildCharacterBuilderRoutes()).toEqual({
      scope: "player-space",
      campaignId: null,
      groupId: null,
      formPath: "/characters/new/players?fromBuilder=1",
      manualFormPath: "/characters/new/players",
      cancelPath: "/characters",
    });
    expect(buildPlayerDraftFromSheet({ firstname: "Thorin" })).toEqual({ firstname: "Thorin", groups: [] });
  });

  it("edge: campaign group routes and a draft in that group", () => {
    const routes = buildCharacterBuilderRoutes({ campaignId: "c1", groupId: "g1" });

    expect(routes.formPath).toBe("/campaigns/c1/groups/g1/characters/new/players?fromBuilder=1");
    expect(routes.scope).toBe("group:g1");
    expect(buildPlayerDraftFromSheet({ firstname: "Thorin", groups: ["other"] }, "g1").groups).toEqual(["g1"]);
  });
});

describe("builder « Next » guard — FR-ruleset-character-builder (Pages and breadcrumb)", () => {
  const raceField = {
    id: "race",
    type: "entitySelect" as const,
    label: "Race",
    required: true,
    locked: false,
    suggestion: null,
    value: null,
    answered: false,
  };
  const grantField = {
    id: "classChoices",
    type: "grantedChoices" as const,
    label: "Choices",
    required: false,
    locked: false,
    suggestion: null,
    value: {},
    answered: false,
    grants: [
      {
        key: "k",
        id: "skills",
        label: "Compétences",
        suggested: false,
        ownerKey: "f",
        ownerLabel: "F",
        options: [],
        expectedCount: 2,
        chosen: [],
      },
    ],
  };
  const racePage: EvaluatedPage = { ...page("race", false), fields: [raceField, grantField] };

  it("nominal: a missing required choice lists its field with its DOM id", () => {
    const fields = pageErrorFields(
      evaluation([racePage], [{ code: "required", severity: "error", stepId: "race", fieldId: "race" }]),
      racePage,
    );

    expect(fields).toEqual([{ fieldId: "race", label: "Race", domId: builderFieldDomId("race", "race") }]);
    expect(builderFieldDomId("level-up:3", "hitPoints")).toBe("builder-level-up-3-hitPoints");
  });

  it("edge: count warnings never block, a grant error shows the grant label", () => {
    const issues: BuilderEvaluation["issues"] = [
      { code: "count-not-reached", severity: "warning", stepId: "race", fieldId: "classChoices", grantId: "skills" },
      { code: "unknown-entry", severity: "error", stepId: "race", fieldId: "classChoices", grantId: "skills" },
    ];

    expect(pageErrorFields(evaluation([racePage], [issues[0]]), racePage)).toEqual([]);
    expect(pageErrorFields(evaluation([racePage], issues), racePage).map((field) => field.label)).toEqual([
      "Compétences",
    ]);
  });

  it("failure guard: errors of another page or repeat index are ignored", () => {
    const levelPage: EvaluatedPage = { ...page("level-up:3", false, 3), fields: [raceField] };
    const issues: BuilderEvaluation["issues"] = [
      { code: "required", severity: "error", stepId: "level-up", fieldId: "race", index: 2 },
      { code: "required", severity: "error", stepId: "class", fieldId: "race" },
    ];

    expect(pageErrorFields(evaluation([levelPage], issues), levelPage)).toEqual([]);
  });
});
