import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const tabPath = resolve(fileURLToPath(new URL("..", import.meta.url)), "CharacterCompanionsTabContent.tsx");
const panelsPath = resolve(
  fileURLToPath(new URL("../../..", import.meta.url)),
  "CharacterTabPanels.tsx",
);

function readSource(path: string) {
  return readFileSync(path, "utf8");
}

describe("FR-session-player-companion-combatants — companions tab without liaison actions", () => {
  it("nominal: session GM fetches companions with sessionCode and hides liaison actions", () => {
    const tab = readSource(tabPath);
    const panels = readSource(panelsPath);

    expect(panels).toContain("showSessionGmCompanionsTab");
    expect(panels).toContain("liaisonActionsEnabled");
    expect(tab).toContain("liaisonActionsEnabled");
    expect(tab).toContain("companionsOfPlayer");
    expect(tab).toContain("sessionCodeForLookup");
    expect(tab).toContain("sessionCode: sessionCodeForLookup");
    expect(tab).toContain("showLiaisonActions");
    expect(tab).toContain("isEditing={showLiaisonActions}");
  });

  it("edge: owner fetch in Player space does not send sessionCode", () => {
    const tab = readSource(tabPath);
    expect(tab).toContain("sessionCode: null");
    expect(tab).not.toContain("canManageLiaisons ? null : sessionCode");
  });

  it("failure: session GM does not persist linkedPlayerId from the companions tab", () => {
    const tab = readSource(tabPath);
    expect(tab).toContain("if (!canManageLiaisons)");
    expect(tab).toContain("persistRef.current = null");
  });
});
