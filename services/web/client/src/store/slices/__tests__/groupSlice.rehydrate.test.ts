import { describe, expect, it } from "vitest";
import { rehydratePersistedGroupState } from "@/store/slices/groupSlice";
import type { Group, GroupState } from "@/types/campaign";

const cachedGroup = {
  _id: "g1",
  label: "Group g1",
  characters: [{ _id: "c1", firstname: "Hero", lastname: "", surname: "", userId: "" }],
} as Group;

describe("FR-sidebar-character-avatars — persisted group cache rehydration", () => {
  it("nominal: keeps cached groups for display but clears lastFetch to force one refetch", () => {
    const state = rehydratePersistedGroupState({
      activeGroups: [cachedGroup],
      archivedGroups: [],
      groupsCampaignId: "campaign-1",
      openGroupId: ["g1"],
      lastFetch: 1_700_000_000_000,
      activeTotal: 1,
    });

    expect(state.activeGroups).toEqual([cachedGroup]);
    expect(state.groupsCampaignId).toBe("campaign-1");
    expect(state.openGroupId).toEqual(["g1"]);
    expect(state.activeTotal).toBe(1);
    expect(state.lastFetch).toBeNull();
  });

  it("edge: transient loading flags persisted mid-request are reset", () => {
    const state = rehydratePersistedGroupState({
      activeGroups: [cachedGroup],
      loading: true,
      loadingMoreActive: true,
      loadingMoreArchived: true,
      error: "boom",
    } as Partial<GroupState>);

    expect(state.loading).toBe(false);
    expect(state.loadingMoreActive).toBe(false);
    expect(state.loadingMoreArchived).toBe(false);
    expect(state.error).toBeNull();
  });

  it("failure: missing or partial persisted state falls back to initial values", () => {
    const fromUndefined = rehydratePersistedGroupState(undefined);
    expect(fromUndefined.activeGroups).toEqual([]);
    expect(fromUndefined.archivedGroups).toEqual([]);
    expect(fromUndefined.groupsCampaignId).toBeNull();
    expect(fromUndefined.lastFetch).toBeNull();

    const partial = rehydratePersistedGroupState({ groupsCampaignId: "campaign-1" });
    expect(partial.activeGroups).toEqual([]);
    expect(partial.openGroupId).toEqual([]);
    expect(partial.activePage).toBe(1);
  });
});
