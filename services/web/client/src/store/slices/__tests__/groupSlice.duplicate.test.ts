import { describe, expect, it } from "vitest";
import groupReducer, {
  addCharacterToGroup,
  addGroupToStore,
  clearGroups,
  setOpenGroup,
} from "@/store/slices/groupSlice";
import type { Group } from "@/types/campaign";

const buildGroup = (overrides: Partial<Group> & { _id: string }): Group => ({
  _id: overrides._id,
  label: overrides.label ?? "Groupe A",
  characters: overrides.characters ?? [],
  campaignId: overrides.campaignId ?? "campaign-1",
  createdAt: "",
  updatedAt: "",
});

describe("FR-040 — groupSlice — duplication optimistic update", () => {
  it("nominal: addCharacterToGroup inserts the duplicate into the target group", () => {
    const initial = groupReducer(
      undefined,
      { type: "group/fetchGroupsSuccess", payload: { active: [buildGroup({ _id: "g1", characters: [{ _id: "c1", firstname: "A", lastname: "", surname: "", userId: "" }] })], archived: [], total: 1 } },
    );
    const state = groupReducer(
      initial,
      addCharacterToGroup({ groupId: "g1", character: { _id: "c2", firstname: "A 2", lastname: "", surname: "" } }),
    );
    const group = state.activeGroups.find((g) => g._id === "g1");
    expect(group?.characters).toHaveLength(2);
    expect(group?.characters.find((c) => c._id === "c2")).toBeDefined();
  });

  it("nominal: addCharacterToGroup does NOT reset openGroupId", () => {
    let state = groupReducer(undefined, setOpenGroup("g1"));
    expect(state.openGroupId).toContain("g1");

    state = groupReducer(
      state,
      addCharacterToGroup({ groupId: "g1", character: { _id: "c-new", firstname: "New", lastname: "", surname: "" } }),
    );
    expect(state.openGroupId).toContain("g1");
  });

  it("edge: addCharacterToGroup ignores duplicates (same _id)", () => {
    const initial = groupReducer(
      undefined,
      { type: "group/fetchGroupsSuccess", payload: { active: [buildGroup({ _id: "g1", characters: [{ _id: "c1", firstname: "A", lastname: "", surname: "", userId: "" }] })], archived: [], total: 1 } },
    );
    const state = groupReducer(
      initial,
      addCharacterToGroup({ groupId: "g1", character: { _id: "c1", firstname: "A", lastname: "", surname: "" } }),
    );
    expect(state.activeGroups[0].characters).toHaveLength(1);
  });

  it("failure guard: clearGroups (used by refreshGroups) DOES reset openGroupId — contrast with addCharacterToGroup", () => {
    let state = groupReducer(undefined, setOpenGroup("g1"));
    expect(state.openGroupId).toContain("g1");
    state = groupReducer(state, clearGroups());
    expect(state.openGroupId).toHaveLength(0);
  });
});

describe("FR-041 — groupSlice — addGroupToStore", () => {
  const newGroup = buildGroup({ _id: "g-new", label: "Orcs 2", characters: [{ _id: "c1", firstname: "Orc", lastname: "", surname: "", userId: "" }] });

  it("nominal: inserts a new group into activeGroups and increments activeTotal", () => {
    const state = groupReducer(undefined, addGroupToStore(newGroup));
    expect(state.activeGroups).toHaveLength(1);
    expect(state.activeGroups[0]._id).toBe("g-new");
    expect(state.activeTotal).toBe(1);
  });

  it("edge: does not insert a group with duplicate _id", () => {
    let state = groupReducer(undefined, addGroupToStore(newGroup));
    state = groupReducer(state, addGroupToStore(newGroup));
    expect(state.activeGroups).toHaveLength(1);
    expect(state.activeTotal).toBe(1);
  });

  it("edge: preserves openGroupId when a new group is added", () => {
    let state = groupReducer(undefined, setOpenGroup("g1"));
    state = groupReducer(state, addGroupToStore(newGroup));
    expect(state.openGroupId).toContain("g1");
  });
});
