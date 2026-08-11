import { describe, expect, it } from "vitest";
import { resolveCodexSpellSchoolLabel } from "@/utils/codexSpellSchool.utils";

describe("FR-codex-spell-school-filter — resolveCodexSpellSchoolLabel", () => {
  it("nominal: returns trimmed string label", () => {
    expect(resolveCodexSpellSchoolLabel("  Évocation  ")).toBe("Évocation");
  });

  it("edge: resolves populated object with name", () => {
    expect(resolveCodexSpellSchoolLabel({ name: "Evocation" })).toBe("Evocation");
  });

  it("failure: returns empty string for nullish or invalid values", () => {
    expect(resolveCodexSpellSchoolLabel(null)).toBe("");
    expect(resolveCodexSpellSchoolLabel(undefined)).toBe("");
    expect(resolveCodexSpellSchoolLabel({})).toBe("");
  });
});
