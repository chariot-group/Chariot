import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const detailViewSource = readFileSync(
  resolve(fileURLToPath(new URL("..", import.meta.url)), "CharacterDetailView.tsx"),
  "utf8",
);

const buttonBefore = (ariaLabelKey: string) =>
  detailViewSource.match(
    new RegExp(`<Button(?:(?!<Button)[\\s\\S])*?aria-label=\\{t\\("${ariaLabelKey}"\\)\\}`),
  )?.[0] ?? "";

/** @see FR-frontend-button-system — character sheet footer mapping */
describe("CharacterDetailView — footer buttons", () => {
  it("nominal: edit and save are primary white buttons of normal size", () => {
    for (const key of ["editCharacter", "saveChanges"]) {
      const button = buttonBefore(key);

      expect(button).toContain('variant="primary"');
      expect(button).not.toMatch(/size=/);
    }
  });

  it("edge: edit and save do not depend on the active tab color", () => {
    expect(buttonBefore("editCharacter")).not.toContain("tone=");
    expect(buttonBefore("saveChanges")).not.toContain("tone=");
    expect(detailViewSource).not.toContain("TAB_COLORS");
  });

  it("failure guard: cancel stays secondary", () => {
    expect(buttonBefore("cancel")).toContain('variant="secondary"');
  });
});
