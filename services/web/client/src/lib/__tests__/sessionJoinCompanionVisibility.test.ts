import { describe, expect, it, vi } from "vitest";
import {
  companionCountByPlayerId,
  loadCompanionCountsForPlayers,
  orderSessionCharactersLikeSidebar,
  sessionCharacterOptionAccessibleName,
} from "@/lib/sessionJoinCompanionVisibility";
import type { Character, NPC } from "@/types/character";

const npc = (id: string, linkedPlayerId?: string | null): NPC =>
  ({
    _id: id,
    firstname: "Wolf",
    lastname: id,
    groups: [],
    linkedPlayerId: linkedPlayerId ?? null,
  }) as unknown as NPC;

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

const player = (id: string): Character => ({ _id: id, firstname: id, groups: [] }) as unknown as Character;
const ids = (characters: Character[]) => characters.map((character) => character._id);

describe("FR-session-join-companion-visibility — order follows the player sidebar", () => {
  it("nominal: reorders the fetched Players like the sidebar", () => {
    const ordered = orderSessionCharactersLikeSidebar(
      [player("A"), player("B"), player("C")],
      [player("C"), player("A"), player("B")],
    );

    expect(ids(ordered)).toEqual(["C", "A", "B"]);
  });

  it("edge: Players unknown to the sidebar follow, keeping fetch order", () => {
    const ordered = orderSessionCharactersLikeSidebar(
      [player("D"), player("A"), player("E"), player("B")],
      [player("B"), player("A")],
    );

    expect(ids(ordered)).toEqual(["B", "A", "D", "E"]);
  });

  it("edge: empty sidebar keeps the fetch order", () => {
    const fetched = [player("B"), player("A")];

    expect(orderSessionCharactersLikeSidebar(fetched, [])).toBe(fetched);
  });

  it("edge: duplicated sidebar ids keep their first position", () => {
    const ordered = orderSessionCharactersLikeSidebar(
      [player("A"), player("B")],
      [player("B"), player("A"), player("B")],
    );

    expect(ids(ordered)).toEqual(["B", "A"]);
  });

  it("failure: a sidebar Player missing from the fetch is not added", () => {
    const ordered = orderSessionCharactersLikeSidebar([player("A")], [player("Z"), player("A")]);

    expect(ids(ordered)).toEqual(["A"]);
  });
});
