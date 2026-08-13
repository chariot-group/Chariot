import { describe, expect, it } from "vitest";
import {
  buildSequentialCopyNames,
  characterDisplayName,
  nextAvailableDuplicateName,
  parseDuplicateNameParts,
} from "@/lib/duplicateName";

describe("FR-character-duplicate — parseDuplicateNameParts", () => {
  it("nominal: splits trailing numeric suffix", () => {
    expect(parseDuplicateNameParts("test 2")).toEqual({ stem: "test", suffix: 2 });
  });

  it("nominal: keeps multi-word stem", () => {
    expect(parseDuplicateNameParts("Aragorn Telcontar 3")).toEqual({
      stem: "Aragorn Telcontar",
      suffix: 3,
    });
  });

  it("edge: no suffix returns full stem", () => {
    expect(parseDuplicateNameParts("Gimli")).toEqual({ stem: "Gimli", suffix: null });
  });

  it("edge: bare number has no space-separated suffix", () => {
    expect(parseDuplicateNameParts("2")).toEqual({ stem: "2", suffix: null });
  });
});

describe("FR-character-duplicate — nextAvailableDuplicateName", () => {
  it("nominal: first copy of test is test 2", () => {
    expect(nextAvailableDuplicateName("test", ["test"])).toBe("test 2");
  });

  it("nominal: second copy skips taken suffix", () => {
    expect(nextAvailableDuplicateName("test", ["test", "test 2"])).toBe("test 3");
  });

  it("nominal: duplicating test 2 still continues stem sequence", () => {
    expect(nextAvailableDuplicateName("test 2", ["test", "test 2"])).toBe("test 3");
  });

  it("edge: fills gaps", () => {
    expect(nextAvailableDuplicateName("test", ["test", "test 2", "test 4"])).toBe("test 3");
  });

  it("edge: empty source yields bare numbers", () => {
    expect(nextAvailableDuplicateName("", [])).toBe("2");
    expect(nextAvailableDuplicateName("", ["2"])).toBe("3");
  });
});

describe("FR-character-duplicate — buildSequentialCopyNames", () => {
  it("nominal: count=2 from proposed test 2 yields test 2 and test 3", () => {
    expect(buildSequentialCopyNames("test 2", 2)).toEqual(["test 2", "test 3"]);
  });

  it("nominal: count=3 from proposed label 2 continues 2, 3, 4", () => {
    expect(buildSequentialCopyNames("Gobelins 2", 3)).toEqual([
      "Gobelins 2",
      "Gobelins 3",
      "Gobelins 4",
    ]);
  });

  it("edge: name without suffix keeps first as-is then appends", () => {
    expect(buildSequentialCopyNames("Hero", 3)).toEqual(["Hero", "Hero 2", "Hero 3"]);
  });

  it("edge: count=1 returns only the proposed name", () => {
    expect(buildSequentialCopyNames("test 2", 1)).toEqual(["test 2"]);
  });

  it("failure: never produces stacked suffixes like test 2 2", () => {
    const names = buildSequentialCopyNames("test 2", 2);
    expect(names).not.toContain("test 2 2");
    expect(names).toEqual(["test 2", "test 3"]);
  });
});

describe("FR-character-duplicate — characterDisplayName", () => {
  it("nominal: joins first and last name", () => {
    expect(characterDisplayName({ firstname: "Frodo", lastname: "Baggins" })).toBe("Frodo Baggins");
  });

  it("edge: null returns empty string", () => {
    expect(characterDisplayName(null)).toBe("");
  });
});
