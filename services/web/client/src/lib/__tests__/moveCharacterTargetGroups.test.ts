import { describe, expect, it } from "vitest";
import { filterMoveTargetGroups } from "@/components/dialogs/MoveCharacterDialog";
import { canMoveCharacterToAnotherGroup } from "@/lib/canMoveCharacterToAnotherGroup";
import type { Group } from "@/types/campaign";

const group = (id: string, label: string): Group =>
  ({
    _id: id,
    label,
    characters: [],
  }) as Group;

describe("filterMoveTargetGroups", () => {
  it("excludes the current group from move targets", () => {
    const groups = [group("g1", "Alpha"), group("g2", "Beta"), group("g3", "Gamma")];

    expect(filterMoveTargetGroups(groups, "g2")).toEqual([group("g1", "Alpha"), group("g3", "Gamma")]);
  });

  it("returns an empty list when only the current group exists", () => {
    expect(filterMoveTargetGroups([group("g1", "Solo")], "g1")).toEqual([]);
  });
});

describe("canMoveCharacterToAnotherGroup", () => {
  it("shows move in active section when more active groups exist beyond pagination", () => {
    expect(
      canMoveCharacterToAnotherGroup({
        isArchivedSection: false,
        activeGroupsTotal: 10,
        activeGroupsHasMore: true,
        loadedActiveGroupIds: ["g1", "g2", "g3"],
        currentGroupId: "g1",
      }),
    ).toBe(true);
  });

  it("hides move in active section when only one active group exists", () => {
    expect(
      canMoveCharacterToAnotherGroup({
        isArchivedSection: false,
        activeGroupsTotal: 1,
        activeGroupsHasMore: false,
        loadedActiveGroupIds: ["g1"],
        currentGroupId: "g1",
      }),
    ).toBe(false);
  });

  it("shows move in archived section when at least one active group exists", () => {
    expect(
      canMoveCharacterToAnotherGroup({
        isArchivedSection: true,
        activeGroupsTotal: 3,
        activeGroupsHasMore: false,
        loadedActiveGroupIds: ["g1", "g2", "g3"],
        currentGroupId: "archived-1",
      }),
    ).toBe(true);
  });
});
