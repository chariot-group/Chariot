import { describe, expect, it, vi } from "vitest";
import {
  companionCountByPlayerId,
  loadCompanionCountsForPlayers,
  sessionCharacterOptionAccessibleName,
} from "@/lib/sessionJoinCompanionVisibility";
import type { NPC } from "@/types/character";

const npc = (id: string, linkedPlayerId?: string | null): NPC =>
  ({
    _id: id,
    firstname: "Wolf",
    lastname: id,
    groups: [],
    linkedPlayerId: linkedPlayerId ?? null,
  }) as NPC;

describe("FR-session-join-companion-visibility — companion counts", () => {
  it("nominal: counts linked NPCs per Player without exposing NPC names", () => {
    const counts = companionCountByPlayerId([
      npc("n1", "p1"),
      npc("n2", "p1"),
      npc("n3", "p2"),
    ]);

    expect(counts).toEqual({ p1: 2, p2: 1 });
  });

  it("edge: ignores unlinked NPCs and blank linkedPlayerId", () => {
    expect(companionCountByPlayerId([npc("n1"), npc("n2", "  "), npc("n3", "p1")])).toEqual({
      p1: 1,
    });
  });

  it("nominal: accessible name appends the discreet count label", () => {
    expect(sessionCharacterOptionAccessibleName("Aragorn", 2, "2 compagnons")).toBe(
      "Aragorn, 2 compagnons",
    );
  });

  it("edge: zero companions keeps the Player name only", () => {
    expect(sessionCharacterOptionAccessibleName("Aragorn", 0, "0 compagnon")).toBe("Aragorn");
  });

  it("failure: companion lookup error returns empty counts", async () => {
    const fetchNpcs = vi.fn().mockRejectedValue(new Error("network"));
    await expect(loadCompanionCountsForPlayers(["p1"], fetchNpcs)).resolves.toEqual({});
  });

  it("edge: empty player ids skip the companion request", async () => {
    const fetchNpcs = vi.fn();
    await expect(loadCompanionCountsForPlayers(["  ", ""], fetchNpcs)).resolves.toEqual({});
    expect(fetchNpcs).not.toHaveBeenCalled();
  });
});
