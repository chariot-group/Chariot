import { describe, expect, it } from "vitest";
import groupReducer, {
  fetchGroupsSuccess,
  loadMoreActiveGroupsSuccess,
  removeCharacterFromGroup,
  setOpenGroup,
} from "@/store/slices/groupSlice";
import type { Group } from "@/types/campaign";

const buildGroup = (id: string, characterIds: string[]): Group =>
  ({
    _id: id,
    label: `Group ${id}`,
    characters: characterIds.map((characterId) => ({
      _id: characterId,
      firstname: "Hero",
      lastname: characterId,
      surname: "",
      userId: "",
    })),
  }) as Group;

describe("FR-sidebar-navigation — GM sidebar group list", () => {
  it("nominal: removeCharacterFromGroup drops character and keeps openGroupId", () => {
    let state = groupReducer(
      undefined,
      fetchGroupsSuccess({
        campaignId: "campaign-1",
        active: [buildGroup("g1", ["c1", "c2", "c3"])],
        archived: [],
        pageSize: 5,
        activeTotal: 1,
        archivedTotal: 0,
      }),
    );
    state = groupReducer(state, setOpenGroup("g1"));
    expect(state.openGroupId).toEqual(["g1"]);

    state = groupReducer(
      state,
      removeCharacterFromGroup({ groupId: "g1", characterId: "c2" }),
    );

    expect(state.activeGroups[0]?.characters.map((character) => character._id)).toEqual(["c1", "c3"]);
    expect(state.openGroupId).toEqual(["g1"]);
  });

  it("edge: removeCharacterFromGroup works in archived groups", () => {
    let state = groupReducer(
      undefined,
      fetchGroupsSuccess({
        campaignId: "campaign-1",
        active: [],
        archived: [buildGroup("g-archived", ["c1", "c2"])],
        pageSize: 5,
        activeTotal: 0,
        archivedTotal: 1,
      }),
    );
    state = groupReducer(state, setOpenGroup("g-archived"));

    state = groupReducer(
      state,
      removeCharacterFromGroup({ groupId: "g-archived", characterId: "c1" }),
    );

    expect(state.archivedGroups[0]?.characters.map((character) => character._id)).toEqual(["c2"]);
    expect(state.openGroupId).toEqual(["g-archived"]);
  });

  it("edge: removeCharacterFromGroup keeps pagination depth after load more", () => {
    let state = groupReducer(
      undefined,
      fetchGroupsSuccess({
        campaignId: "campaign-1",
        active: [buildGroup("g1", ["c1"])],
        archived: [],
        pageSize: 1,
        activeTotal: 2,
        archivedTotal: 0,
      }),
    );
    state = groupReducer(
      state,
      loadMoreActiveGroupsSuccess({
        groups: [buildGroup("g2", ["c2", "c3"])],
        total: 2,
        pageSize: 1,
      }),
    );
    state = groupReducer(state, setOpenGroup("g2"));
    expect(state.activeGroups).toHaveLength(2);
    expect(state.activePage).toBe(2);

    state = groupReducer(
      state,
      removeCharacterFromGroup({ groupId: "g2", characterId: "c2" }),
    );

    expect(state.activeGroups).toHaveLength(2);
    expect(state.activePage).toBe(2);
    expect(state.activeGroups[1]?.characters.map((character) => character._id)).toEqual(["c3"]);
    expect(state.openGroupId).toEqual(["g2"]);
  });
});
