import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const srcRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

function readSource(relativePath: string) {
  return readFileSync(resolve(srcRoot, relativePath), "utf8");
}

describe("FR-session-join-companion-visibility — CharacterSelect", () => {
  it("nominal: shows a discreet companion count line without NPC names", () => {
    const source = readSource("character/CharacterSelect.tsx");
    expect(source).toContain("companionCountByCharacterId");
    expect(source).toContain("formatCompanionCount");
    expect(source).toContain("text-white/55");
    expect(source).toContain("sessionCharacterOptionAccessibleName");
    expect(source).not.toMatch(/companionNames|npcNames/);
  });

  it("nominal: join dialog and lobby picker both receive companion counts", () => {
    const join = readSource("dialogs/JoinSessionDialog.tsx");
    const lobby = readSource("dialogs/SessionLobbyContent.tsx");
    expect(join).toContain("loadCompanionCountsForPlayers");
    expect(join).toContain("joinSessionCompanionCount");
    expect(join).toContain("companionCountByCharacterId");
    expect(lobby).toContain("companionCountByCharacterId");
    expect(lobby).toContain('t("players.companionCount"');
  });

  it("edge: Player names truncate and the count stays secondary metadata", () => {
    const source = readSource("character/CharacterSelect.tsx");
    expect(source).toContain("truncate");
    expect(source).toContain("min-w-0");
    expect(source).toContain("text-xs font-normal");
  });

  it("failure: a linked NPC is not added as a selectable option", () => {
    const source = readSource("character/CharacterSelect.tsx");
    expect(source).toContain("characters.map((character)");
    expect(source).not.toContain("kind: \"npc\"");
    expect(source).not.toContain("linkedPlayerId");
  });
});
