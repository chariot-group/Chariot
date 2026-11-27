import { describe, expect, it } from "vitest";
import { textSuggestions } from "@/lib/characterBuilder/textSuggestions";
import { pointBuyCost, readAllocationConfig } from "@/lib/characterBuilder/abilityAllocation";

/** @see FR-ruleset-character-builder — Web builder UI (Fields) */

const field = { config: { suggestionsFrom: "background", suggestionsKey: "ideals" } };
const stateWith = (ideals: unknown) => ({ entries: { background: { data: { suggestions: { ideals } } } } });

describe("text suggestions of a field", () => {
  it("nominal: translated suggestions are given in the user's locale", () => {
    const state = stateWith([
      { en: "Faith", fr: "Foi", es: "Fe" },
      { en: "Charity", fr: "Charité" },
    ]);

    expect(textSuggestions(field, state, "fr")).toEqual(["Foi", "Charité"]);
  });

  it("edge: a missing translation falls back to English, plain texts are kept", () => {
    const state = stateWith([{ en: "Charity", fr: "Charité" }, "Tradition"]);

    expect(textSuggestions(field, state, "es")).toEqual(["Charity", "Tradition"]);
  });

  it("failure guard: no source, no list or malformed items give no suggestion", () => {
    expect(textSuggestions({ config: {} }, stateWith(["x"]), "fr")).toEqual([]);
    expect(textSuggestions(field, {}, "fr")).toEqual([]);
    expect(textSuggestions(field, stateWith([3, null, { de: "Glaube" }, "  "]), "fr")).toEqual([]);
  });
});

describe("point-buy cost of a value", () => {
  const config = readAllocationConfig({ pointBuy: { budget: 27, costs: { "8": 0, "13": 5, "15": 9 } } });

  it("nominal: each value costs what the config says", () => {
    expect(pointBuyCost(config.pointBuy, 15)).toBe(9);
    expect(pointBuyCost(config.pointBuy, 13)).toBe(5);
  });

  it("edge: the lowest value is free", () => {
    expect(pointBuyCost(config.pointBuy, 8)).toBe(0);
  });

  it("failure guard: a value or config without cost counts 0", () => {
    expect(pointBuyCost(config.pointBuy, 18)).toBe(0);
    expect(pointBuyCost(undefined, 15)).toBe(0);
  });
});

describe("grant titles stay distinct", () => {
  it("nominal: unique titles are kept", async () => {
    const { distinctTitles } = await import("@/components/characterBuilder/fields/GrantedChoicesField");
    expect(distinctTitles(["Armure", "Armes"])).toEqual(["Armure", "Armes"]);
  });

  it("edge: repeated titles are numbered in order", async () => {
    const { distinctTitles } = await import("@/components/characterBuilder/fields/GrantedChoicesField");
    expect(distinctTitles(["Arme", "Sac", "Arme"])).toEqual(["Arme (1)", "Sac", "Arme (2)"]);
  });

  it("failure guard: no title gives no title", async () => {
    const { distinctTitles } = await import("@/components/characterBuilder/fields/GrantedChoicesField");
    expect(distinctTitles([])).toEqual([]);
  });
});
