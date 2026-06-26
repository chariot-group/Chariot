import { describe, expect, it } from "vitest";
import { displayTextToStoredFeetRange, storedFeetRangeToDisplayText } from "@/utils/unit.utils";
import { displayDistanceFt, metersToFeet } from "@/utils/unit.utils";

describe("storedFeetRangeToDisplayText", () => {
  it("returns empty string for empty stored range", () => {
    expect(storedFeetRangeToDisplayText("", (ft) => displayDistanceFt(ft, "metric"))).toBe("");
  });

  it("passes through free-text ranges unchanged", () => {
    expect(storedFeetRangeToDisplayText("Self", (ft) => displayDistanceFt(ft, "metric"))).toBe("Self");
  });
});

describe("displayTextToStoredFeetRange", () => {
  it("stores numeric metric input as feet range on commit", () => {
    expect(displayTextToStoredFeetRange("9", metersToFeet)).toBe("30 ft.");
  });

  it("stores free-text ranges unchanged", () => {
    expect(displayTextToStoredFeetRange("Touch", metersToFeet)).toBe("Touch");
  });

  it("returns null for empty input", () => {
    expect(displayTextToStoredFeetRange("", metersToFeet)).toBe(null);
  });
});
