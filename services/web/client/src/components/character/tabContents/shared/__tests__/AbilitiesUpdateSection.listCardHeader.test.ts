import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const abilitiesUpdateSectionPath = resolve(
  fileURLToPath(new URL("..", import.meta.url)),
  "AbilitiesUpdateSection.tsx",
);

/** @see FR-character-list-card: the add control stays in the card header, above the bounded rows */
describe("FR-character-list-card — abilities edit header", () => {
  const source = readFileSync(abilitiesUpdateSectionPath, "utf8");

  it("nominal: keeps title and add controls in the list card header, above the bounded rows", () => {
    expect(source).toContain("<ListCard");
    expect(source).toContain("boundedClassName={EDIT_LIST_MAX_HEIGHT_CLASS}");
    expect(source).toContain('aria-label={tBattle("abilityAdd")}');
  });

  it("edge: opens the newly appended ability and scrolls to its index", () => {
    expect(source).toContain("const newIndex = fields.length");
    expect(source).toContain('document.getElementById(`ability-${newIndex}`)');
    expect(source).toContain('scrollIntoView({ behavior: "smooth", block: "nearest" })');
  });

  it("error: the add control lives in the header actions, not among the rows", () => {
    const actionsProp = source.match(/actions=\{[\s\S]*?\n {6}\}/)?.[0];
    expect(actionsProp).toBeTruthy();
    expect(actionsProp).toContain("abilityAdd");
    expect(actionsProp).not.toContain("<Accordion");
  });
});
