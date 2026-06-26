import { describe, expect, it } from "vitest";
import { displayTextToStoredValue, storedValueToDisplayText } from "@/hooks/useStoredUnitInput";
import { displayDistanceFt, feetToMeters, metersToFeet } from "@/utils/unit.utils";

describe("storedValueToDisplayText", () => {
  it("returns empty string for null or empty stored values", () => {
    expect(storedValueToDisplayText(null, displayDistanceFt)).toBe("");
    expect(storedValueToDisplayText("", displayDistanceFt)).toBe("");
  });

  it("converts stored feet to metric display text", () => {
    expect(storedValueToDisplayText(30, (ft) => displayDistanceFt(ft, "metric"))).toBe("9");
  });

  it("keeps imperial stored feet as display text", () => {
    expect(storedValueToDisplayText(30, (ft) => displayDistanceFt(ft, "imperial"))).toBe("30");
  });
});

describe("displayTextToStoredValue", () => {
  it("returns null for empty input", () => {
    expect(displayTextToStoredValue("", metersToFeet)).toBe(null);
    expect(displayTextToStoredValue("   ", metersToFeet)).toBe(null);
  });

  it("returns invalid for non-numeric input", () => {
    expect(displayTextToStoredValue("abc", metersToFeet)).toBe("invalid");
  });

  it("converts metric display input to stored feet on commit", () => {
    expect(displayTextToStoredValue("9", metersToFeet)).toBe(30);
    expect(displayTextToStoredValue("2222", metersToFeet)).toBe(7406.7);
    expect(feetToMeters(7406.7)).toBe(2222);
  });

  it("preserves imperial display input as stored feet", () => {
    const toStored = (value: number) => value;
    expect(displayTextToStoredValue("2222", toStored)).toBe(2222);
  });
});
