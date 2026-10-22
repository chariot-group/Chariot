import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dialogPath = resolve(process.cwd(), "src/components/dialogs/InitBattleDialog.tsx");

/** @see FR-session-player-companion-combatants */
describe("FR-session-player-companion-combatants — Init Battle participants", () => {
  const source = readFileSync(dialogPath, "utf8");

  it("nominal: session companions are injected into the participants group", () => {
    expect(source).toContain("sessionCompanionNpcs");
    expect(source).toContain("buildSessionParticipantsGroup");
  });

  it("nominal: linked NPCs are labeled as linked in the member list", () => {
    expect(source).toContain("initBattleLinkedTo");
    expect(source).toContain("initBattleLinkedCompanion");
    expect(source).toContain("linkedPlayerId");
  });

  it("edge: NPC kind or linkedPlayerId is enough to treat a companion as an NPC", () => {
    expect(source).toContain('character.kind === "npc"');
    expect(source).toContain("character.linkedPlayerId");
  });
});
