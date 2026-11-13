import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/components/layout/Sidebar/CharactersWithoutGroupList.tsx"), "utf8");
const button = source.match(/<CreateCharacterDialog>\s*(<button[\s\S]*?<\/button>)/)?.[1] ?? "";

/** @see docs/design.md — create buttons: icon on the left of the label */
describe("Sidebar — player space create character button", () => {
  it("nominal: icon is rendered before the label", () => {
    const iconIndex = button.indexOf("<UserPlus");
    const labelIndex = button.indexOf('{t("createCharacter")}');

    expect(iconIndex).toBeGreaterThan(-1);
    expect(labelIndex).toBeGreaterThan(iconIndex);
  });

  it("edge: uses the primary start-aligned full-width variant", () => {
    expect(button).toContain('buttonVariants({ variant: "primary", align: "start" })');
    expect(button).toContain("w-full");
  });

  it("failure guard: icon is decorative and the visible label is the accessible name", () => {
    expect(button).toMatch(/<UserPlus\s+aria-hidden="true"/);
    expect(button).not.toContain("aria-label=");
  });
});
