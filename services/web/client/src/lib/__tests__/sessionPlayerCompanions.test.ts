/** @see FR-session-player-companion-combatants */

import { describe, expect, it } from "vitest";
import {
  assignedPlayerCharacterIds,
  assignedPlayerIdsSignature,
  companionCharacterIds,
  companionNamesLine,
  companionTrackerRowIdsToRemove,
  companionsGroupedByPlayerId,
  companionsOfPlayer,
  diffCharacterIds,
  ungroupedSessionCompanions,
} from "@/lib/sessionPlayerCompanions";
import type { SessionParticipant } from "@/services/SessionService";
import type { NPC } from "@/types/character";

const participant = (overrides: Partial<SessionParticipant> = {}): SessionParticipant => ({
  id: "p1",
  userId: "u1",
  status: "connected",
  characterId: "pj-1",
  joinedAt: "2026-01-01T00:00:00.000Z",
  sessionId: "s1",
  ...overrides,
});

const npc = (id: string, linkedPlayerId: string, firstname = "Wolf"): NPC =>
  ({
    _id: id,
    kind: "npc",
    firstname,
    linkedPlayerId,
  }) as NPC;

describe("FR-session-player-companion-combatants", () => {
  it("nominal: assigned player ids include roster PCs and ignore empty assignments", () => {
    expect(
      assignedPlayerCharacterIds([
        participant({ status: "gameMaster", characterId: "gm-char" }),
        participant({ characterId: "pj-1" }),
        participant({ id: "p2", userId: "u2", characterId: "  " }),
        participant({ id: "p3", userId: "u3", characterId: "pj-1" }),
      ]),
    ).toEqual(["gm-char", "pj-1"]);
  });

  it("nominal: companion names line lists linked NPCs for a player", () => {
    const grouped = companionsGroupedByPlayerId([
      npc("n1", "pj-1", "Wolf"),
      npc("n2", "pj-1", "Hawk"),
      npc("n3", "pj-2", "Cat"),
    ]);
    expect(companionNamesLine(grouped["pj-1"] ?? [])).toBe("Wolf, Hawk");
    expect(companionCharacterIds(grouped["pj-1"] ?? [])).toEqual(["n1", "n2"]);
    expect(companionsOfPlayer([npc("n1", "pj-1"), npc("n3", "pj-2")], "pj-1").map((item) => item._id)).toEqual(["n1"]);
  });

  it("edge: player with zero companions has no names line", () => {
    expect(companionNamesLine([])).toBe("");
    expect(assignedPlayerIdsSignature([])).toBe("");
  });

  it("edge: diff detects added and removed companion ids", () => {
    expect(diffCharacterIds(["n1", "n2"], ["n2", "n3"])).toEqual({
      added: ["n3"],
      removed: ["n1"],
    });
  });

  it("failure: leaving a player only removes isPlayerCompanion tracker rows", () => {
    const ids = companionTrackerRowIdsToRemove(
      [
        { id: "g:n1", characterId: "n1", isPlayerCompanion: true },
        { id: "g:n2", characterId: "n2" },
        { id: "g:n3", characterId: "n3", isPlayerCompanion: true },
      ],
      ["n1", "n2"],
    );
    expect(ids).toEqual(["g:n1"]);
  });

  it("edge: companions without a matching player id stay available as ungrouped", () => {
    const list = [npc("n1", "pj-1"), npc("n2", "")];
    (list[1] as { linkedPlayerId?: string | null }).linkedPlayerId = null;
    const grouped = companionsGroupedByPlayerId(list);
    expect(ungroupedSessionCompanions(list, grouped).map((item) => item._id)).toEqual(["n2"]);
  });
});
