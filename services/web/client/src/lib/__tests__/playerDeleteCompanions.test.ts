/** @see FR-player-delete-companion-choice */

import { describe, expect, it, vi } from "vitest";
import type { NPC } from "@/types/character";
import {
  linkedCompanionsForPlayer,
  syncReduxAfterPlayerDelete,
} from "@/lib/playerDeleteCompanions";
import {
  removeCharacterWithoutGroup,
  removePlayerSpaceNpc,
  upsertPlayerSpaceNpc,
} from "@/store/slices/characterSlice";
import { removeCharacterFromGroup } from "@/store/slices/groupSlice";

const npc = (id: string, linkedPlayerId: string, groups: string[] = []): NPC =>
  ({
    _id: id,
    firstname: id,
    lastname: "",
    kind: "npc",
    linkedPlayerId,
    groups,
  }) as NPC;

describe("FR-player-delete-companion-choice", () => {
  it("nominal: linkedCompanionsForPlayer returns NPCs for the player id", () => {
    const linked = [npc("c1", "p1"), npc("c2", "p1"), npc("c3", "p2")];
    expect(linkedCompanionsForPlayer(linked, "p1").map((item) => item._id)).toEqual(["c1", "c2"]);
  });

  it("nominal: syncReduxAfterPlayerDelete unlinks companions when keeping them", () => {
    const dispatch = vi.fn();
    const companions = [npc("c1", "p1")];

    syncReduxAfterPlayerDelete(dispatch, {
      playerId: "p1",
      deleteLinkedCompanions: false,
      companions,
    });

    expect(dispatch).toHaveBeenCalledWith(removeCharacterWithoutGroup("p1"));
    expect(dispatch).toHaveBeenCalledWith(
      upsertPlayerSpaceNpc({ ...companions[0], linkedPlayerId: null }),
    );
  });

  it("edge: syncReduxAfterPlayerDelete removes companions from groups when cascading", () => {
    const dispatch = vi.fn();
    const companions = [npc("c1", "p1", ["g1"])];

    syncReduxAfterPlayerDelete(dispatch, {
      playerId: "p1",
      deleteLinkedCompanions: true,
      companions,
      campaignGroupId: "g2",
    });

    expect(dispatch).toHaveBeenCalledWith(
      removeCharacterFromGroup({ groupId: "g2", characterId: "p1" }),
    );
    expect(dispatch).toHaveBeenCalledWith(removePlayerSpaceNpc("c1"));
    expect(dispatch).toHaveBeenCalledWith(
      removeCharacterFromGroup({ groupId: "g1", characterId: "c1" }),
    );
  });
});
