import { describe, expect, it } from "vitest";
import { buildDuplicateGroupLabel } from "@/components/dialogs/DuplicateGroupDialog";

describe("FR-group-duplicate — DuplicateGroupDialog — buildDuplicateGroupLabel", () => {
  it("nominal: appends '2' after the group label", () => {
    expect(buildDuplicateGroupLabel({ label: "Gobelins" })).toBe("Gobelins 2");
  });

  it("nominal: trims whitespace before appending", () => {
    expect(buildDuplicateGroupLabel({ label: "  Orcs  " })).toBe("Orcs 2");
  });

  it("edge: returns '2' when group is null", () => {
    expect(buildDuplicateGroupLabel(null)).toBe("2");
  });

  it("edge: returns '2' when label is empty string", () => {
    expect(buildDuplicateGroupLabel({ label: "" })).toBe("2");
  });

  it("edge: returns '2' when label is only whitespace", () => {
    expect(buildDuplicateGroupLabel({ label: "   " })).toBe("2");
  });
});

describe("FR-group-duplicate — multi-copy group naming", () => {
  const copyLabel = (base: string, i: number) => (i === 0 ? base : `${base} ${i + 1}`);

  it("nominal: first copy keeps label as-is", () => {
    expect(copyLabel("Gobelins 2", 0)).toBe("Gobelins 2");
  });

  it("nominal: subsequent copies append incremented suffix", () => {
    expect(copyLabel("Gobelins 2", 1)).toBe("Gobelins 2 2");
    expect(copyLabel("Gobelins 2", 2)).toBe("Gobelins 2 3");
  });

  it("edge: count=1 produces exactly one label", () => {
    const labels = Array.from({ length: 1 }, (_, i) => copyLabel("Trolls", i));
    expect(labels).toEqual(["Trolls"]);
  });

  it("edge: count=3 produces three distinct labels", () => {
    const labels = Array.from({ length: 3 }, (_, i) => copyLabel("Dragons", i));
    expect(labels).toEqual(["Dragons", "Dragons 2", "Dragons 3"]);
  });
});
