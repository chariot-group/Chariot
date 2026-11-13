import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const tabPath = resolve(fileURLToPath(new URL("..", import.meta.url)), "CharacterCompanionsTabContent.tsx");
const panelsPath = resolve(fileURLToPath(new URL("../../..", import.meta.url)), "CharacterTabPanels.tsx");

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
    expect(tab).toContain("showLiaisonActions = canManageLiaisons");
  });

  it("edge: owner fetch in Player space does not send sessionCode", () => {
    const tab = readSource(tabPath);
    expect(tab).toContain("sessionCode: null");
    expect(tab).not.toContain("canManageLiaisons ? null : sessionCode");
  });

  it("failure: session GM does not expose liaison persist actions", () => {
    const tab = readSource(tabPath);
    expect(tab).toContain("canManageLiaisons = liaisonActionsEnabled");
    expect(tab).toContain("showLiaisonActions = canManageLiaisons");
    expect(tab).toContain("persistSidebarNpcLinkedPlayer");
  });

  it("guard: the search toolbar renders without liaison actions (session GM) and filters the list", () => {
    const tab = readSource(tabPath);
    expect(tab).toContain("filterCompanionsByQuery(sortedCompanions, searchQuery)");
    expect(tab).toContain("visibleCompanions.map(");
    expect(tab).toMatch(/<CompanionsSearchField[\s\S]*\{liaisonActions \?/);
    expect(tab).not.toMatch(/\{liaisonActions \? \(\s*<div className=\{cn\(COMPANIONS_SLOTS\.toolbar/);
  });
});
