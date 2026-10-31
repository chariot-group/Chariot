import { describe, expect, it } from "vitest";
import sidebarReducer, {
  setCompanionNestCollapsed,
  selectCollapsedCompanionNestPlayerIds,
} from "@/store/slices/sidebarSlice";
import type { RootState } from "@/store";

/** @see FR-sidebar-linked-npc-nesting-collapse */
describe("FR-sidebar-linked-npc-nesting-collapse — sidebarSlice", () => {
  it("nominal: collapsing then expanding a player nest updates persisted ids", () => {
    let state = sidebarReducer(undefined, setCompanionNestCollapsed({ playerId: "p1", collapsed: true }));
    expect(state.collapsedCompanionNestPlayerIds).toEqual(["p1"]);

    state = sidebarReducer(state, setCompanionNestCollapsed({ playerId: "p1", collapsed: false }));
    expect(state.collapsedCompanionNestPlayerIds).toEqual([]);
  });

  it("edge: duplicate collapse requests keep a single id", () => {
    let state = sidebarReducer(undefined, setCompanionNestCollapsed({ playerId: "p1", collapsed: true }));
    state = sidebarReducer(state, setCompanionNestCollapsed({ playerId: "p1", collapsed: true }));
    expect(state.collapsedCompanionNestPlayerIds).toEqual(["p1"]);
  });

  it("failure: selector defaults to empty when unset", () => {
    const root = { sidebar: { collapsedCompanionNestPlayerIds: ["p2"] } } as RootState;
    expect(selectCollapsedCompanionNestPlayerIds(root)).toEqual(["p2"]);
  });
});
