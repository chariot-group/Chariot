import { describe, expect, it } from "vitest";
import characterReducer, {
  setLinkedNpcs,
  setUnlinkedNpcsWithoutGroup,
  upsertPlayerSpaceNpc,
  removePlayerSpaceNpc,
} from "@/store/slices/characterSlice";
import type { NPC } from "@/types/character";

const npc = (id: string, linkedPlayerId?: string | null): NPC =>
  ({
    _id: id,
    firstname: "Wolf",
    lastname: id,
    groups: [],
    linkedPlayerId: linkedPlayerId ?? null,
    challenge: { challengeRating: 1, experiencePoints: 50 },
  }) as NPC;

describe("FR-npc-player-link — player space NPC slice", () => {
  it("nominal: linking moves an NPC from root to nested list", () => {
    let state = characterReducer(undefined, setUnlinkedNpcsWithoutGroup([npc("n1")]));
    state = characterReducer(state, upsertPlayerSpaceNpc(npc("n1", "p1")));

    expect(state.unlinkedNpcsWithoutGroup.map((item) => item._id)).toEqual([]);
    expect(state.linkedNpcs.map((item) => item._id)).toEqual(["n1"]);
  });

  it("edge: unlinking a companion restores it as a root NPC", () => {
    let state = characterReducer(undefined, setLinkedNpcs([npc("n1", "p1")]));
    state = characterReducer(state, upsertPlayerSpaceNpc(npc("n1", null)));

    expect(state.linkedNpcs).toHaveLength(0);
    expect(state.unlinkedNpcsWithoutGroup.map((item) => item._id)).toEqual(["n1"]);
  });

  it("failure: removing an unknown NPC is a no-op", () => {
    const state = characterReducer(undefined, removePlayerSpaceNpc("missing"));
    expect(state.linkedNpcs).toEqual([]);
    expect(state.unlinkedNpcsWithoutGroup).toEqual([]);
  });
});
