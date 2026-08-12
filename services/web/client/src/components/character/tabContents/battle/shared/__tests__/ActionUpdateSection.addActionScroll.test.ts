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
});
