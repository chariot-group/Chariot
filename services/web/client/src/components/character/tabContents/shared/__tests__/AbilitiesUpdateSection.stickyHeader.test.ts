import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const abilitiesUpdateSectionPath = resolve(
  fileURLToPath(new URL("..", import.meta.url)),
  "AbilitiesUpdateSection.tsx",
);

/** @see FR-frontend-design: sticky add header remains reachable while the list scrolls */
describe("FR-frontend-design — abilities sticky add header", () => {
  const source = readFileSync(abilitiesUpdateSectionPath, "utf8");

  it("nominal: keeps title and add controls in a sticky header card", () => {
    expect(source).toContain("sticky top-0 z-10");
    expect(source).toContain("bg-card");
    expect(source).toContain('aria-label={tBattle("abilityAdd")}');
  });

  it("edge: opens the newly appended ability and scrolls to its index", () => {
    expect(source).toContain("const newIndex = fields.length");
    expect(source).toContain('document.getElementById(`ability-${newIndex}`)');
    expect(source).toContain('scrollIntoView({ behavior: "smooth", block: "nearest" })');
  });

  it("error: does not wrap the accordion list inside the sticky header card", () => {
    const stickyCardMatch = source.match(
      /<Card className="sticky top-0 z-10[\s\S]*?<\/Card>/,
    );
    expect(stickyCardMatch?.[0]).toBeTruthy();
    expect(stickyCardMatch?.[0]).not.toContain("<Accordion");
  });
});
