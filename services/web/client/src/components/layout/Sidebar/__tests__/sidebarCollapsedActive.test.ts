import { describe, expect, it } from "vitest";
import {
  collapsedActiveCompanionId,
  collapsedActiveGroupCharacterId,
  shouldAutoExpandCompanionNest,
} from "@/components/layout/Sidebar/shared/sidebarCollapsedActive";

/** @see FR-sidebar-linked-npc-nesting-collapse */
describe("shouldAutoExpandCompanionNest", () => {
  const base = { previousSelectedId: "p1", selectedId: "n1", companionIds: ["n1", "n2"], userCollapsed: true };

  it("nominal: expands when navigating to a companion of a collapsed nest", () => {
    expect(shouldAutoExpandCompanionNest(base)).toBe(true);
  });

  it("edge: does not re-expand when the selection did not change (manual collapse sticks)", () => {
    expect(shouldAutoExpandCompanionNest({ ...base, previousSelectedId: "n1" })).toBe(false);
  });

  it("failure: ignores unrelated selection, no selection, or already expanded nest", () => {
    expect(shouldAutoExpandCompanionNest({ ...base, selectedId: "other" })).toBe(false);
    expect(shouldAutoExpandCompanionNest({ ...base, selectedId: null })).toBe(false);
    expect(shouldAutoExpandCompanionNest({ ...base, userCollapsed: false })).toBe(false);
  });
});

describe("collapsedActiveCompanionId", () => {
  it("nominal: returns the hidden active companion when collapsed", () => {
    expect(collapsedActiveCompanionId(false, "n1", ["n1"])).toBe("n1");
  });

  it("edge: null when the nest is expanded", () => {
    expect(collapsedActiveCompanionId(true, "n1", ["n1"])).toBeNull();
  });

  it("failure: null when selection is not a companion", () => {
    expect(collapsedActiveCompanionId(false, "p1", ["n1"])).toBeNull();
    expect(collapsedActiveCompanionId(false, null, ["n1"])).toBeNull();
  });
});

/** @see FR-sidebar-group-collapsed-active-indicator */
describe("collapsedActiveGroupCharacterId", () => {
  const characters = [{ _id: "c1" }, { _id: "c2" }];

  it("nominal: collapsed group containing the selected character", () => {
    expect(collapsedActiveGroupCharacterId(false, "c2", characters)).toBe("c2");
  });

  it("edge: expanded group has no highlight", () => {
    expect(collapsedActiveGroupCharacterId(true, "c2", characters)).toBeNull();
  });

  it("failure: collapsed group without the selected character or without characters", () => {
    expect(collapsedActiveGroupCharacterId(false, "x", characters)).toBeNull();
    expect(collapsedActiveGroupCharacterId(false, "c1", undefined)).toBeNull();
  });
});
