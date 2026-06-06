import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InitiativeTrackerRow } from "@/components/initiativeTracker/InitiativeTrackerRow";
import type { InitiativeTrackerRow as InitiativeTrackerRowType } from "@/store/slices/sessionSlice";

const labels = {
  initiativeFor: "Initiative",
  viewSheetFor: "View character sheet",
  viewSheet: "View sheet",
  viewOwnSheet: "View my sheet",
  onlyOwnCharacterSheet: "Only your sheet is available",
  conditionFor: "Conditions",
  conditionSearchPlaceholder: "Search",
  conditionSearchClear: "Clear",
  conditionClearAll: "Clear all",
  conditionSearchEmpty: "Empty",
  conditionAddBack: "Back",
  conditionAddConfirm: "Add",
  conditionDurationEnable: "Enable duration",
  conditionDurationAmount: "Duration amount",
  conditionRoundHint: "Round hint",
  visibleFor: "Visible for players",
  playerDisplayNameSubtitle: "Player alias",
  hitPointsFor: "Hit points",
  hitPointsSessionTooltip: "Edit hit points",
  hpAbbr: "HP",
  hiddenField: "Hidden",
  otherGroup: "Other group",
  expandDetails: "Expand details",
  collapseDetails: "Collapse details",
  detailsFor: "Details",
  activeTurn: "Active turn",
  visibilityDialog: {
    title: "Visibility",
    showToPlayers: "Show to players",
    playerDisplayName: "Alias",
    playerDisplayNameHint: "Alias hint",
    playerDisplayNamePlaceholder: "Alias placeholder",
    fields: {
      initiative: "Initiative",
      name: "Name",
      hitPoints: "Hit points",
      armorClass: "AC",
      conditions: "Conditions",
      groupLabel: "Group",
    },
    apply: "Apply",
    cancel: "Cancel",
    configureFor: "Configure",
    leaveInitiative: "Remove",
    playerRowVisibilityHint: "Visibility hint",
  },
  getConditionLabel: () => "Condition",
  getConditionDescription: () => "Condition description",
  formatConditionEntryDuration: () => null,
  getConditionDurationUnits: () => [],
  getStatusLabel: () => "Alive",
};

const baseRow: InitiativeTrackerRowType = {
  id: "row-1",
  characterId: "character-1",
  groupId: "group-1",
  groupLabel: "Companions with an unexpectedly long name",
  firstname: "A character with a very long first name",
  lastname: "and an even longer family name",
  surname: "",
  initiative: 12,
  hitPoints: 18,
  maxHitPoints: 24,
  tempHitPoints: 0,
  armorClass: 16,
  visible: true,
  playerDisplayName: "A very long alias intended to be truncated for players as well",
  playerFieldVisibility: {
    initiative: true,
    name: true,
    hitPoints: true,
    armorClass: true,
    conditions: true,
    groupLabel: true,
  },
  conditions: [],
  avatar: "",
  kind: "npc",
  deathSavesFailures: 0,
};

describe("InitiativeTrackerRow responsive name truncation", () => {
  it("nominal: GM link wrapper constrains width and keeps truncated name/alias", () => {
    const html = renderToStaticMarkup(
      <InitiativeTrackerRow
        row={baseRow}
        mode="gm"
        getSheetHref={(characterId) => `/character/${characterId}`}
        labels={labels}
      />,
    );

    expect(html).toContain("flex w-full max-w-full min-w-0 overflow-hidden justify-self-start text-left");
    expect(html).toContain("block w-full max-w-full min-w-0 flex-1 basis-0 overflow-hidden underline");
    expect(html).toContain("flex w-full max-w-full min-w-0 flex-1 basis-0 flex-col overflow-hidden");
    expect(html).toContain("block w-full min-w-0 max-w-full truncate text-base font-semibold text-white");
    expect(html).toContain("block w-full min-w-0 max-w-full truncate text-xs font-medium text-white/55");
  });

  it("edge: player read-only wrapper also constrains width for truncation", () => {
    const html = renderToStaticMarkup(
      <InitiativeTrackerRow
        row={baseRow}
        mode="player"
        ownCharacterId="other-character"
        labels={labels}
      />,
    );

    expect(html).toContain("block w-full max-w-full min-w-0 flex-1 basis-0 overflow-hidden cursor-not-allowed text-white/85");
    expect(html).toContain("block w-full min-w-0 max-w-full truncate text-base font-semibold text-white");
  });

  it("error path: hidden player names stay masked instead of exposing long text", () => {
    const html = renderToStaticMarkup(
      <InitiativeTrackerRow
        row={{
          ...baseRow,
          playerDisplayName: "",
          playerFieldVisibility: { ...baseRow.playerFieldVisibility, name: false },
        }}
        mode="player"
        ownCharacterId="other-character"
        labels={labels}
      />,
    );

    expect(html).toContain("Hidden");
    expect(html).not.toContain("A character with a very long first name");
  });

  it("edge: hidden real name uses the player alias in a truncated container", () => {
    const html = renderToStaticMarkup(
      <InitiativeTrackerRow
        row={{
          ...baseRow,
          playerFieldVisibility: { ...baseRow.playerFieldVisibility, name: false },
        }}
        mode="player"
        ownCharacterId="other-character"
        labels={labels}
      />,
    );

    expect(html).toContain("A very long alias intended to be truncated for players as well");
    expect(html).toContain("block w-full min-w-0 max-w-full truncate text-base font-semibold text-white");
    expect(html).not.toContain("A character with a very long first name");
  });

  it("nominal: visible player name uses the configured display name override", () => {
    const html = renderToStaticMarkup(
      <InitiativeTrackerRow
        row={{
          ...baseRow,
          playerDisplayName: "Disguised traveler",
          playerFieldVisibility: { ...baseRow.playerFieldVisibility, name: true },
        }}
        mode="player"
        ownCharacterId="other-character"
        labels={labels}
      />,
    );

    expect(html).toContain("Disguised traveler");
    expect(html).not.toContain("A character with a very long first name");
  });
});
