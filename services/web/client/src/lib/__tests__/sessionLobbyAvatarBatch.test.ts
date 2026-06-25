import { describe, expect, it, vi } from "vitest";
import {
  buildSessionLobbyAvatarBatchItems,
  getSessionLobbyParticipantAvatarUrl,
  resolveSessionLobbyParticipantAvatar,
} from "@/lib/sessionLobbyAvatarBatch";
import type { SessionParticipant } from "@/services/SessionService";

const gmParticipant: SessionParticipant = {
  id: "p-gm",
  userId: "user-gm",
  characterId: null,
  status: "gameMaster",
  joinedAt: "2026-01-01T00:00:00.000Z",
  sessionId: "sess-1",
};

const playerParticipant: SessionParticipant = {
  id: "p-player",
  userId: "user-player",
  characterId: "char-1",
  status: "connected",
  joinedAt: "2026-01-01T00:00:00.000Z",
  sessionId: "sess-1",
};

describe("FR-media-avatar-read-access — session lobby avatar batch", () => {
  it("nominal: GM uses user scope for profile picture", () => {
    const items = buildSessionLobbyAvatarBatchItems({
      participants: [gmParticipant],
      participantAvatars: { "user-gm": "gm-avatar-key" },
      characterDetails: {},
    });

    expect(items).toEqual([
      {
        scope: "user",
        entityId: "user-gm",
        storedValue: "gm-avatar-key",
        size: "thumb",
      },
    ]);
  });

  it("nominal: player uses character scope for PJ avatar", () => {
    const items = buildSessionLobbyAvatarBatchItems({
      participants: [playerParticipant],
      participantAvatars: { "user-player": "player-pp-key" },
      characterDetails: {
        "char-1": { avatar: "char-avatar-key" },
      },
    });

    expect(items).toEqual([
      {
        scope: "character",
        entityId: "char-1",
        storedValue: "char-avatar-key",
        size: "thumb",
      },
    ]);
  });

  it("edge: player profile picture is never requested for non-GM participants", () => {
    const items = buildSessionLobbyAvatarBatchItems({
      participants: [playerParticipant],
      participantAvatars: { "user-player": "player-pp-key" },
      characterDetails: {},
    });

    expect(items).toEqual([]);
  });

  it("edge: player without assigned character yields no batch item", () => {
    const items = buildSessionLobbyAvatarBatchItems({
      participants: [{ ...playerParticipant, characterId: null }],
      participantAvatars: {},
      characterDetails: {},
    });

    expect(items).toEqual([]);
  });
});

describe("resolveSessionLobbyParticipantAvatar", () => {
  it("nominal: resolves GM descriptor from user scope", () => {
    expect(
      resolveSessionLobbyParticipantAvatar(gmParticipant, { "user-gm": "gm-key" }, {}),
    ).toEqual({
      scope: "user",
      entityId: "user-gm",
      storedValue: "gm-key",
    });
  });

  it("nominal: getSessionLobbyParticipantAvatarUrl delegates to batch getter", () => {
    const descriptor = resolveSessionLobbyParticipantAvatar(
      playerParticipant,
      {},
      { "char-1": { avatar: "char-key" } },
    );
    const getUrl = vi.fn().mockReturnValue("https://cdn.example/char");

    expect(getSessionLobbyParticipantAvatarUrl(descriptor, getUrl)).toBe("https://cdn.example/char");
    expect(getUrl).toHaveBeenCalledWith("character", "char-1", "thumb");
  });
});
