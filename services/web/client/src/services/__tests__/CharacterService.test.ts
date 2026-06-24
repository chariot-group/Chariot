import { beforeEach, describe, expect, it, vi } from "vitest";

const patchMock = vi.fn();
const emitCharacterSheetUpdatedMock = vi.fn();
const getSessionSnapshotForBroadcastMock = vi.fn();

vi.mock("@/services/ApiService", () => ({
  default: () => ({
    patch: patchMock,
  }),
}));

vi.mock("@/lib/sessionCharacterSyncBridge", () => ({
  emitCharacterSheetUpdated: emitCharacterSheetUpdatedMock,
}));

vi.mock("@/lib/sessionSnapshot", () => ({
  getSessionSnapshotForBroadcast: getSessionSnapshotForBroadcastMock,
}));

describe("CharacterService.updateCharacter — FR-session-combat-sync", () => {
  beforeEach(() => {
    patchMock.mockReset();
    emitCharacterSheetUpdatedMock.mockReset();
    getSessionSnapshotForBroadcastMock.mockReset();
  });

  it("nominal: broadcasts a session sync event after updating a player sheet in session context", async () => {
    const payload = { message: "ok", data: { _id: "char-player" } };
    patchMock.mockResolvedValue({ data: payload });
    getSessionSnapshotForBroadcastMock.mockReturnValue({ code: "ABC123", isInSession: true });

    const { default: CharacterService } = await import("../CharacterService");

    await CharacterService.updateCharacter("players", "char-player", { firstname: "Lyra" }, "ABC123");

    expect(emitCharacterSheetUpdatedMock).toHaveBeenCalledWith("ABC123", "char-player");
  });

  it("edge: also broadcasts after updating an NPC sheet during a session", async () => {
    const payload = { message: "ok", data: { _id: "char-npc" } };
    patchMock.mockResolvedValue({ data: payload });
    getSessionSnapshotForBroadcastMock.mockReturnValue({ code: "ABC123", isInSession: true });

    const { default: CharacterService } = await import("../CharacterService");

    await CharacterService.updateCharacter("npcs", "char-npc", { surname: "Goblin boss" }, "ABC123");

    expect(emitCharacterSheetUpdatedMock).toHaveBeenCalledWith("ABC123", "char-npc");
  });

  it("error: does not broadcast when no active session snapshot is available", async () => {
    const payload = { message: "ok", data: { _id: "char-offline" } };
    patchMock.mockResolvedValue({ data: payload });
    getSessionSnapshotForBroadcastMock.mockReturnValue(null);

    const { default: CharacterService } = await import("../CharacterService");

    await CharacterService.updateCharacter("players", "char-offline", { firstname: "Solo" }, null);

    expect(emitCharacterSheetUpdatedMock).not.toHaveBeenCalled();
  });
});
