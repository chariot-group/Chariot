import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const srcRoot = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });

/** Surface tokens are fills: as text they blend into cards (design.md 2.1.1, FR-frontend-design). */
const SURFACE_TEXT = /(?<![\w-])text-gray(-middle-light)?(?![\w-])/;

describe("Surface tokens are never used as text color", () => {
  const files = sourceFiles(srcRoot);

  it("nominal: the source tree is scanned", () => {
    expect(files.some((file) => file.endsWith("PlayerGeneralTabEdit.tsx"))).toBe(true);
  });

  it("failure guard: no component sets text-gray or text-gray-middle-light", () => {
    const offenders = files.filter((file) => SURFACE_TEXT.test(readFileSync(file, "utf8")));

    expect(offenders).toEqual([]);
  });

  it("edge: edit-mode helper texts (class level info, ability bonus label) use the readable secondary text", () => {
    const generalEdit = readFileSync(
      join(srcRoot, "components/character/tabContents/general/form/PlayerGeneralTabEdit.tsx"),
      "utf8",
    );
    const abilityScores = readFileSync(
      join(srcRoot, "components/character/tabContents/general/form/AbilityScoresEdit.tsx"),
      "utf8",
    );

    expect(generalEdit).toMatch(/text-muted-foreground">\s*\{t\("classLevelInfo"/);
    expect(abilityScores).toContain(
      '<label className="text-xs text-muted-foreground leading-none">{t("abilityBonus")}</label>',
    );
    expect(SURFACE_TEXT.test("text-gray-200 text-gray-light")).toBe(false);
  });
});
