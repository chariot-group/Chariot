import { describe, expect, it } from "vitest";
import {
  buildBulkVisibilityUpdatePayload,
  createBulkVisibilityDraft,
  createBulkVisibilityTouchedState,
  deriveBulkVisibilitySummary,
} from "@/components/initiativeTracker/bulkSelection";
import {
  defaultPlayerFieldVisibilityForKind,
  type InitiativeTrackerRow,
} from "@/store/slices/sessionSlice";

const buildRow = (
  overrides: Partial<InitiativeTrackerRow> & { id: string },
): InitiativeTrackerRow => ({
  id: overrides.id,
  characterId: overrides.characterId ?? overrides.id,
  firstname: overrides.firstname ?? "Gobelin",
  lastname: "",
  surname: "",
  avatar: "",
  initiative: overrides.initiative ?? 10,
  hitPoints: overrides.hitPoints ?? 7,
  maxHitPoints: overrides.maxHitPoints ?? 7,
  tempHitPoints: overrides.tempHitPoints ?? 0,
  armorClass: overrides.armorClass ?? 15,
  conditions: overrides.conditions ?? [],
  groupId: overrides.groupId ?? "g1",
  groupLabel: overrides.groupLabel ?? "Monstres",
  visible: overrides.visible ?? true,
  playerDisplayName: overrides.playerDisplayName ?? "Alias",
  playerFieldVisibility:
    overrides.playerFieldVisibility ?? defaultPlayerFieldVisibilityForKind("npc"),
  kind: overrides.kind ?? "npc",
  deathSavesFailures: overrides.deathSavesFailures ?? 0,
});

describe("FR-031 — bulk visibility selection summary", () => {
  it("nominal: derives shared values when every selected row matches", () => {
    const rows = [
      buildRow({
        id: "a",
        visible: true,
        playerDisplayName: "Masked foes",
        playerFieldVisibility: {
          initiative: false,
          name: true,
          hitPoints: false,
          armorClass: false,
          conditions: false,
          groupLabel: false,
        },
      }),
      buildRow({
        id: "b",
        visible: true,
        playerDisplayName: "Masked foes",
        playerFieldVisibility: {
          initiative: false,
          name: true,
          hitPoints: false,
          armorClass: false,
          conditions: false,
          groupLabel: false,
        },
      }),
    ];

    expect(deriveBulkVisibilitySummary(rows)).toEqual({
      visible: true,
      playerDisplayName: "Masked foes",
      playerFieldVisibility: {
        initiative: false,
        name: true,
        hitPoints: false,
        armorClass: false,
        conditions: false,
        groupLabel: false,
      },
    });
  });

  it("edge: derives mixed values when selected rows differ", () => {
    const rows = [
      buildRow({ id: "a", visible: true, playerDisplayName: "Alias A" }),
      buildRow({
        id: "b",
        visible: false,
        playerDisplayName: "Alias B",
        playerFieldVisibility: {
          initiative: true,
          name: false,
          hitPoints: true,
          armorClass: false,
          conditions: false,
          groupLabel: false,
        },
      }),
    ];

    expect(deriveBulkVisibilitySummary(rows)).toEqual({
      visible: "mixed",
      playerDisplayName: "mixed",
      playerFieldVisibility: {
        initiative: "mixed",
        name: "mixed",
        hitPoints: "mixed",
        armorClass: false,
        conditions: false,
        groupLabel: false,
      },
    });
  });
});

describe("FR-031 — bulk visibility partial update payload", () => {
  it("nominal: emits only touched values", () => {
    const summary = deriveBulkVisibilitySummary([
      buildRow({ id: "a" }),
      buildRow({ id: "b" }),
    ]);
    const draft = createBulkVisibilityDraft(summary);
    const touched = createBulkVisibilityTouchedState();

    draft.visible = false;
    touched.visible = true;
    draft.playerFieldVisibility.hitPoints = true;
    touched.playerFieldVisibility.hitPoints = true;
    draft.playerDisplayName = "Foes";
    draft.playerDisplayNameMixed = false;
    touched.playerDisplayName = true;

    expect(buildBulkVisibilityUpdatePayload(draft, touched)).toEqual({
      changes: {
        visible: false,
        playerFieldVisibility: { hitPoints: true },
      },
      playerDisplayName: "Foes",
    });
  });

  it("error: untouched mixed fields are omitted to preserve existing row values", () => {
    const draft = createBulkVisibilityDraft({
      visible: "mixed",
      playerDisplayName: "mixed",
      playerFieldVisibility: {
        initiative: "mixed",
        name: true,
        hitPoints: "mixed",
        armorClass: false,
        conditions: false,
        groupLabel: false,
      },
    });
    const touched = createBulkVisibilityTouchedState();

    expect(buildBulkVisibilityUpdatePayload(draft, touched)).toEqual({
      changes: {},
      playerDisplayName: undefined,
    });
  });
});
