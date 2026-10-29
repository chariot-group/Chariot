import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const detailViewPath = resolve(fileURLToPath(new URL("..", import.meta.url)), "CharacterDetailView.tsx");
const formPath = resolve(fileURLToPath(new URL("../../../hooks", import.meta.url)), "useCharacterForm.ts");

function readSource(path: string) {
  return readFileSync(path, "utf8");
}

describe("FR-session-player-companion-combatants — session GM character sheets", () => {
  it("nominal: session GM can edit assigned PC/NPC data and sees the companions tab", () => {
    const source = readSource(detailViewPath);

    expect(source).toContain("isSessionGmUser");
    expect(source).toContain("showSessionGmCompanionsTab");
    expect(source).toContain("liaisonActionsEnabled={!showSessionGmCompanionsTab}");
    expect(source).toContain("sessionCode: sessionCodeForMedia");
  });

  it("edge: companion NPC sheets show linked-player footer shortcut in session", () => {
    const source = readSource(detailViewPath);

    expect(source).toContain("showLinkedPlayerFooter");
    expect(source).toContain("NpcLinkedPlayerFooterLink");
    expect(source).toContain("isGmViewingNpcSheet && isSessionGmEditContext");
    expect(source).toContain("buildSessionCharacterHref(npcLinkedPlayerId");
  });

  it("failure: session NPC save strips linkedPlayerId", () => {
    const source = readSource(formPath);

    expect(source).toContain("type === 'npcs' && sessionCode?.trim()");
    expect(source).toContain("delete updatePayload.linkedPlayerId");
  });
});
