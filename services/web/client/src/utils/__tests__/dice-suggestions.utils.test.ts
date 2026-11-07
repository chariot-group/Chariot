import { describe, expect, it } from "vitest";
import { getDiceSuggestions } from "@/utils/dice-suggestions.utils";

/** @see FR-character-list-card (dice suggestions) */
describe("getDiceSuggestions", () => {
  it("nominal: a count followed by d proposes every damage die with that count", () => {
    expect(getDiceSuggestions("2d")).toEqual(["2d4", "2d6", "2d8", "2d10", "2d12"]);
    expect(getDiceSuggestions("d")).toEqual(["d4", "d6", "d8", "d10", "d12"]);
  });

  it("edge: typed faces filter the dice and an exact die is not proposed again", () => {
    expect(getDiceSuggestions("2d1")).toEqual(["2d10", "2d12"]);
    expect(getDiceSuggestions("3D")).toEqual(["3d4", "3d6", "3d8", "3d10", "3d12"]);
    expect(getDiceSuggestions("1d10")).toEqual([]);
    expect(getDiceSuggestions("1d12")).toEqual([]);
  });

  it("failure: a full formula, a number alone or plain text gets no suggestion", () => {
    expect(getDiceSuggestions("")).toEqual([]);
    expect(getDiceSuggestions("2")).toEqual([]);
    expect(getDiceSuggestions("1d6+3")).toEqual([]);
    expect(getDiceSuggestions("dégâts")).toEqual([]);
    expect(getDiceSuggestions("1d7")).toEqual([]);
  });
});
