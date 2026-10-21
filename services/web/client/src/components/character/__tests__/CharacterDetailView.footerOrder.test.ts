import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sourcePath = resolve(fileURLToPath(new URL("..", import.meta.url)), "CharacterDetailView.tsx");

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

describe("CharacterDetailView merged footer", () => {
  it("nominal: passes character edit controls into the combat footer during sessions", () => {
    const source = readSource();

    expect(source).toContain("const characterFooterActions = showEditControls ? (");
    expect(source).toMatch(/<CombatBanner[\s\S]*characterId=\{character\._id\}[\s\S]*footerActions=\{characterFooterActions\}[\s\S]*\/>/);
  });

  it("edge: keeps one footer path for in-session character sheets", () => {
    const source = readSource();
    const combatFooterMatches = source.match(/<CombatBanner\b/g) ?? [];
    const bannerIndex = source.indexOf("<CombatBanner");

    expect(combatFooterMatches).toHaveLength(1);
    expect(source).toContain("footerActions={characterFooterActions}");
    expect(source).not.toContain("sticky bottom-0");
    expect(source).not.toContain("{isInSession && <CombatBanner />}");
    expect(bannerIndex).toBeGreaterThan(-1);
    expect(bannerIndex).toBeLessThan(source.indexOf("</form>"));
  });
});
