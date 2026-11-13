import { describe, expect, it } from "vitest";
import { currentHitPointsFollowsMax, syncCurrentHitPointsOnMaxChange } from "@/utils/hitPoints.utils";

/** @see FR-character-statistics-card (edit mode — hit points fields) */
describe("syncCurrentHitPointsOnMaxChange", () => {
  it("nominal: current at full health follows the new max (10 / 10 → 45)", () => {
    expect(syncCurrentHitPointsOnMaxChange(10, 10, 45)).toBe(45);
  });

  it("nominal: typing digit by digit keeps current in step (10 → 4 → 45)", () => {
    const afterFirstDigit = syncCurrentHitPointsOnMaxChange(10, 10, 4);
    expect(afterFirstDigit).toBe(4);
    expect(syncCurrentHitPointsOnMaxChange(afterFirstDigit, 4, 45)).toBe(45);
  });

  it.each([undefined, null, ""])("edge: an empty current (%s) takes the new max", (current) => {
    expect(syncCurrentHitPointsOnMaxChange(current, 10, 30)).toBe(30);
  });

  it("edge: a string current equal to max (raw form input) still follows", () => {
    expect(syncCurrentHitPointsOnMaxChange("12", 12, 20)).toBe(20);
  });

  it("edge: a wounded character keeps its current HP", () => {
    expect(syncCurrentHitPointsOnMaxChange(7, 10, 45)).toBeUndefined();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, "45", undefined])(
    "failure: a non-numeric max (%s) never overwrites current",
    (nextMax) => {
      expect(syncCurrentHitPointsOnMaxChange(10, 10, nextMax)).toBeUndefined();
    },
  );
});

describe("currentHitPointsFollowsMax", () => {
  it("nominal: true at full health, false when wounded", () => {
    expect(currentHitPointsFollowsMax(10, 10)).toBe(true);
    expect(currentHitPointsFollowsMax(7, 10)).toBe(false);
  });

  it("edge: an empty or unparsable current follows max", () => {
    expect(currentHitPointsFollowsMax("", 10)).toBe(true);
    expect(currentHitPointsFollowsMax("abc", 10)).toBe(true);
  });
});
