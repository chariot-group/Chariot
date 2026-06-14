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
    expect(source).toContain("<CombatBanner footerActions={characterFooterActions} />");
  });

  it("edge: keeps one footer path for in-session character sheets", () => {
    const source = readSource();
    const combatFooterMatches = source.match(/<CombatBanner footerActions=\{characterFooterActions\} \/>/g) ?? [];

    expect(combatFooterMatches).toHaveLength(1);
    expect(source).not.toContain("{isInSession && <CombatBanner />}");
    expect(source.indexOf("<CombatBanner footerActions={characterFooterActions} />")).toBeLessThan(source.indexOf("</form>"));
  });
});
