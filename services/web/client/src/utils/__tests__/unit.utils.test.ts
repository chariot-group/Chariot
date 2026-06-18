import { describe, it, expect } from "vitest";
import {
  feetToMeters, metersToFeet, convertRangeString, convertRangeStringBoth, displayDistanceFt,
  feetToCm, cmToFeet, lbsToKg, kgToLbs,
} from "../unit.utils";

describe("feetToMeters", () => {
  it("converts 30ft to 9m", () => {
    expect(feetToMeters(30)).toBe(9);
  });

  it("converts 5ft to 1.5m", () => {
    expect(feetToMeters(5)).toBe(1.5);
  });

  it("converts 0ft to 0m", () => {
    expect(feetToMeters(0)).toBe(0);
  });

  it("converts 60ft to 18m", () => {
    expect(feetToMeters(60)).toBe(18);
  });
});

describe("metersToFeet", () => {
  it("converts 9m to 30ft", () => {
    expect(metersToFeet(9)).toBe(30);
  });

  it("converts 1.5m to 5ft", () => {
    expect(metersToFeet(1.5)).toBe(5);
  });

  it("converts 0m to 0ft", () => {
    expect(metersToFeet(0)).toBe(0);
  });
});

describe("displayDistanceFt", () => {
  it("returns feet value unchanged for imperial", () => {
    expect(displayDistanceFt(30, "imperial")).toBe(30);
  });

  it("converts to meters for metric", () => {
    expect(displayDistanceFt(30, "metric")).toBe(9);
  });
});

describe("convertRangeString", () => {
  it("returns range unchanged for imperial", () => {
    expect(convertRangeString("30 ft.", "imperial")).toBe("30 ft.");
  });

  it("converts simple range to metric", () => {
    expect(convertRangeString("30 ft.", "metric")).toBe("9 m");
  });

  it("converts dual range to metric", () => {
    expect(convertRangeString("60/120 ft.", "metric")).toBe("18/36 m");
  });

  it("passes through Touch unchanged", () => {
    expect(convertRangeString("Touch", "metric")).toBe("Touch");
  });

  it("passes through Self unchanged", () => {
    expect(convertRangeString("Self", "metric")).toBe("Self");
  });

  it("converts numeric part of cone description", () => {
    const result = convertRangeString("Self (10-foot cone)", "metric");
    expect(result).toBe("Self (3 m cone)");
  });

  it("handles range without dot", () => {
    expect(convertRangeString("60 feet", "metric")).toBe("18 m");
  });
});

describe("convertRangeStringBoth", () => {
  it("appends original ft value in parentheses", () => {
    expect(convertRangeStringBoth("30 ft.")).toBe("9 m (30 ft.)");
  });

  it("handles dual ranges", () => {
    expect(convertRangeStringBoth("60/120 ft.")).toBe("18/36 m (60/120 ft.)");
  });

  it("passes through non-numeric strings unchanged", () => {
    expect(convertRangeStringBoth("Touch")).toBe("Touch");
  });
});

describe("feetToCm / cmToFeet", () => {
  it("converts 6ft to 183cm", () => {
    expect(feetToCm(6)).toBe(183);
  });

  it("converts 0ft to 0cm", () => {
    expect(feetToCm(0)).toBe(0);
  });

  it("converts 183cm back to ~6ft", () => {
    expect(cmToFeet(183)).toBeCloseTo(6, 0);
  });
});

describe("lbsToKg / kgToLbs", () => {
  it("converts 150lbs to ~68kg", () => {
    expect(lbsToKg(150)).toBeCloseTo(68, 0);
  });

  it("converts 0lbs to 0kg", () => {
    expect(lbsToKg(0)).toBe(0);
  });

  it("converts 68kg back to ~150lbs", () => {
    expect(kgToLbs(68)).toBeCloseTo(150, 0);
  });
});
