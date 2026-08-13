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

  it("nominal: increments past an existing copy", () => {
    expect(buildDuplicateGroupLabel({ label: "Gobelins" }, ["Gobelins", "Gobelins 2"])).toBe(
      "Gobelins 3",
    );
  });

  it("nominal: duplicating a copy continues the stem sequence", () => {
    expect(buildDuplicateGroupLabel({ label: "Gobelins 2" }, ["Gobelins", "Gobelins 2"])).toBe(
      "Gobelins 3",
    );
  });
});
