import { describe, expect, it } from "vitest";
import {
  buildMoveGroupOptions,
  filterMoveTargetGroups,
  sortMoveTargetGroups,
  type MoveTargetGroup,
} from "@/components/dialogs/MoveCharacterDialog";
import { canMoveCharacterToAnotherGroup } from "@/lib/canMoveCharacterToAnotherGroup";

const group = (id: string, label: string, isArchived = false): MoveTargetGroup =>
  ({
    _id: id,
    label,
    characters: [],
    isArchived,
  }) as MoveTargetGroup;

describe("filterMoveTargetGroups", () => {
  it("excludes the current group from move targets", () => {
    const groups = [group("g1", "Alpha"), group("g2", "Beta"), group("g3", "Gamma")];

    expect(filterMoveTargetGroups(groups, "g2")).toEqual([group("g1", "Alpha"), group("g3", "Gamma")]);
  });

  it("returns an empty list when only the current group exists", () => {
    expect(filterMoveTargetGroups([group("g1", "Solo")], "g1")).toEqual([]);
  });
});

describe("sortMoveTargetGroups", () => {
  it("lists active groups before archived groups", () => {
    const sorted = sortMoveTargetGroups([
      group("a2", "Beta", true),
      group("a1", "Alpha", true),
      group("g2", "Delta"),
      group("g1", "Charlie"),
    ]);

    expect(sorted.map((item) => item._id)).toEqual(["g1", "g2", "a1", "a2"]);
  });
});

describe("buildMoveGroupOptions", () => {
  it("adds an archived badge and input label for archived groups", () => {
    expect(buildMoveGroupOptions([group("g1", "Active"), group("a1", "Old", true)], "Archivé")).toEqual([
      { value: "g1", label: "Active", description: undefined, inputLabel: "Active" },
      {
        value: "a1",
        label: "Old",
        description: "Archivé",
        inputLabel: "Old (Archivé)",
      },
    ]);
  });
});

describe("canMoveCharacterToAnotherGroup", () => {
  it("shows move when more active groups exist beyond pagination", () => {
    expect(
      canMoveCharacterToAnotherGroup({
        activeGroupsTotal: 10,
        activeGroupsHasMore: true,
        archivedGroupsTotal: 0,
        archivedGroupsHasMore: false,
        loadedActiveGroupIds: ["g1", "g2", "g3"],
        loadedArchivedGroupIds: [],
        currentGroupId: "g1",
      }),
    ).toBe(true);
  });

  it("shows move when only archived groups can receive the character", () => {
    expect(
      canMoveCharacterToAnotherGroup({
        activeGroupsTotal: 1,
        activeGroupsHasMore: false,
        archivedGroupsTotal: 2,
        archivedGroupsHasMore: false,
        loadedActiveGroupIds: ["g1"],
        loadedArchivedGroupIds: ["a1", "a2"],
        currentGroupId: "g1",
      }),
    ).toBe(true);
  });

  it("hides move when only one group exists in the campaign", () => {
    expect(
      canMoveCharacterToAnotherGroup({
        activeGroupsTotal: 1,
        activeGroupsHasMore: false,
        archivedGroupsTotal: 0,
        archivedGroupsHasMore: false,
        loadedActiveGroupIds: ["g1"],
        loadedArchivedGroupIds: [],
        currentGroupId: "g1",
      }),
    ).toBe(false);
  });
});
