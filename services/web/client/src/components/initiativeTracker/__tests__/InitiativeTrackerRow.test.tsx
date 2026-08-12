import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    if (values) {
      return `${key}:${JSON.stringify(values)}`;
    }
    return key;
  },
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children?: ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { InitiativeTrackerRow } from "@/components/initiativeTracker/InitiativeTrackerRow";
import type { InitiativeTrackerRow as InitiativeTrackerRowType } from "@/store/slices/sessionSlice";

const labels = {
  initiativeFor: "Initiative",
  initiativeModifierFor: (bonus: string) => `Initiative bonus ${bonus}`,
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
  ownCharacterBadge: "You",
  ownCharacterLabel: "This is your character",
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
      lifeStatus: "Vital status",
      armorClass: "AC",
      conditions: "Conditions",
      concentration: "Concentration",
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
  initiativeModifier: 2,
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
    lifeStatus: true,
    armorClass: true,
    conditions: true,
    concentration: true,
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

    expect(html).toContain('data-tracker-grid-cell-align="character"');
    expect(html).toContain("block w-full max-w-full min-w-0 flex-1 basis-0 overflow-hidden underline");
    expect(html).toContain("flex w-full max-w-full min-w-0 flex-1 basis-0 flex-col overflow-hidden");
    expect(html).toContain("block min-w-0 max-w-full flex-1 truncate text-base font-semibold text-white");
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
    expect(html).toContain("block min-w-0 max-w-full flex-1 truncate text-base font-semibold text-white");
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
    expect(html).toContain("block min-w-0 max-w-full flex-1 truncate text-base font-semibold text-white");
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

  it("nominal: own player row renders a dedicated badge", () => {
    const html = renderToStaticMarkup(
      <InitiativeTrackerRow
        row={baseRow}
        mode="player"
        ownCharacterId={baseRow.characterId}
        ownCharacterSheetHref={`/character/${baseRow.characterId}`}
        labels={labels}
      />,
    );

    expect(html).toContain("You");
    expect(html).toContain("This is your character");
  });

  it("nominal: own player row can render editable initiative when unlocked", () => {
    const html = renderToStaticMarkup(
      <InitiativeTrackerRow
        row={baseRow}
        mode="player"
        ownCharacterId={baseRow.characterId}
        initiativeLocked={false}
        onUpdateRow={() => {}}
        labels={labels}
      />,
    );

    expect(html).toContain('type="number"');
    expect(html).toContain("Initiative bonus +2");
    expect(html).toContain("+2");
    // total 12, modifier 2 → roll field shows 10
    expect(html).toContain('value="10"');
  });

  it("edge: player does not see other combatants initiative modifier", () => {
    const html = renderToStaticMarkup(
      <InitiativeTrackerRow
        row={baseRow}
        mode="player"
        ownCharacterId="other-character"
        initiativeLocked={false}
        labels={labels}
      />,
    );

    expect(html).not.toContain("Initiative bonus +2");
    expect(html).not.toContain('type="number"');
  });

  it("nominal: grid condition and group cells are isolated to prevent overlap", () => {
    const html = renderToStaticMarkup(
      <InitiativeTrackerRow
        row={{
          ...baseRow,
          groupLabel: "Participants",
          concentration: { spellName: "Entangle" },
        }}
        mode="gm"
        battleStarted
        getSheetHref={(characterId) => `/character/${characterId}`}
        onAddCondition={() => {}}
        onRemoveCondition={() => {}}
        onClearConditions={() => {}}
        labels={labels}
      />,
    );

    expect(html).toContain('data-tracker-grid-cell-align="condition"');
    expect(html).toContain('data-tracker-grid-cell-align="group"');
    expect(html).toContain("overflow-x-clip");
    expect(html).toContain("md:grid");
  });
});
