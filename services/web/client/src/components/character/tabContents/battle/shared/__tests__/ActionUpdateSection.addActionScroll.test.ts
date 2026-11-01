import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const actionUpdateSectionPath = resolve(
  fileURLToPath(new URL("..", import.meta.url)),
  "ActionUpdateSection.tsx",
);

/** @see FR-frontend-design: nested scroll container must not shift sheet layout on add */
describe("FR-frontend-design — add action scroll behavior", () => {
  const source = readFileSync(actionUpdateSectionPath, "utf8");

  it("nominal: opens the newly appended action and scrolls to its index", () => {
    expect(source).toContain("const newIndex = fields.length");
    expect(source).toContain("setOpenAccordionValues((prev) => [...prev, `action-${newIndex}`])");
    expect(source).toContain('document.getElementById(`action-${newIndex}`)');
  });

  it("edge: uses nearest block to avoid scrolling outer ancestors", () => {
    expect(source).toContain('scrollIntoView({ behavior: "smooth", block: "nearest" })');
    expect(source).not.toContain('block: "center"');
  });

  it("error: does not target the previous last action after append", () => {
    expect(source).not.toContain("fields.length - 1");
    expect(source).not.toContain("fields.length > 0 ? document.getElementById(`action-${fields.length - 1}`)");
  });

  it("edge: the edit list is bounded (taller cap) so the add controls stay visible above the rows", () => {
    expect(source).toContain("<ListCard");
    expect(source).toContain("boundedClassName={EDIT_LIST_MAX_HEIGHT_CLASS}");
  });

  it("nominal: submitting with errors scrolls to the first invalid row", () => {
    expect(source).toContain("document.getElementById(invalid[0])?.scrollIntoView(");
  });

  it("nominal: focuses the new action name field after append (FR-character-list-card)", () => {
    expect(source).toContain("document.getElementById(`${sectionId}-action-${newIndex}-name`)?.focus(");
  });
});
