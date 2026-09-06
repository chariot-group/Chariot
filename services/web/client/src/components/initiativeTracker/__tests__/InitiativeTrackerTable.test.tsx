import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
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

import {
  canConfigureBulkVisibility,
  InitiativeTrackerTable,
} from "@/components/initiativeTracker/InitiativeTrackerTable";
import {
  PLAYER_TRACKER_GRID_TEMPLATE_COLUMNS,
  TRACKER_GRID_TEMPLATE_COLUMNS,
} from "@/components/initiativeTracker/constants";
import type { InitiativeTrackerTableProps } from "@/components/initiativeTracker/InitiativeTrackerTable";

const columnLabels = {
  initiative: "Initiative",
  character: "Personnage",
  hitPoints: "PV",
  armorClass: "CA",
  condition: "Etat",
  group: "Groupe",
  visible: "Afficher",
};

const getRowLabels: InitiativeTrackerTableProps["getRowLabels"] = () => {
  throw new Error("Rows are not rendered in this header-only test");
};

describe("InitiativeTrackerTable responsive header", () => {
  it("nominal: exposes compact and full labels so technical columns stay readable", () => {
    const html = renderToStaticMarkup(
      <InitiativeTrackerTable
        rows={[]}
        columnLabels={columnLabels}
        getRowLabels={getRowLabels}
        groupedInitiativeLabels={{
          enableMode: "Configure grouped initiative",
          disableMode: "Close grouped initiative",
          enableModeShort: "Initiative",
          disableModeShort: "Close",
          getSelectedCountLabel: (count) => `${count} selected`,
          initiativePlaceholder: "Initiative",
          apply: "Apply",
          clearSelection: "Clear",
          clearSelectionShort: "Clear",
          selectAllRows: "Select all rows",
          selectAllRowsShort: "All",
        }}
        bulkVisibilityLabels={{
          enableMode: "Configure display",
          disableMode: "Close display configuration",
          enableModeShort: "Display",
          disableModeShort: "Close",
          modeTitle: "Display",
          getSelectedCountLabel: (count) => `${count} selected`,
          selectAllRows: "Select all rows",
          selectAllRowsShort: "All",
          clearSelection: "Clear",
          clearSelectionShort: "Clear",
          title: "Display configuration",
          description: "Configure display fields",
          showToPlayers: "Show to players",
          playerDisplayName: "Alias",
          playerDisplayNameHint: "Alias hint",
          playerDisplayNamePlaceholder: "Alias placeholder",
          fieldsTitle: "Fields",
          emptySelection: "Select at least one row",
          configure: "Configure",
          configureShort: "Set",
          cancel: "Cancel",
          leaveInitiative: "Leave initiative",
          fields: {
            initiative: "Initiative",
            name: "Name",
            hitPoints: "Hit points",
            lifeStatus: "Vital status",
            armorClass: "Armor class",
            conditions: "Conditions",
            groupLabel: "Group",
          },
        }}
      />,
    );

    expect(html).toContain("text-xs font-bold text-white");
    expect(html).toContain("Init.");
    expect(html).toContain("Aff.");
    expect(html).toContain("Initiative");
    expect(html).toContain("Afficher");
    expect(html).toContain('aria-label="Configure display"');
    expect(html).toContain('aria-label="Configure grouped initiative"');
    expect(html).toContain(">Display</span>");
    expect(html).toContain(">Initiative</span>");
    expect(html).toContain("md:hidden");
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain(TRACKER_GRID_TEMPLATE_COLUMNS);
  });

  it("edge: grouped display configure actions require at least one selected row", () => {
    expect(canConfigureBulkVisibility(0)).toBe(false);
    expect(canConfigureBulkVisibility(1)).toBe(true);
  });

  it("edge: player header keeps the readable compact labels without the GM display column", () => {
    const html = renderToStaticMarkup(
      <InitiativeTrackerTable
        rows={[]}
        mode="player"
        columnLabels={columnLabels}
        getRowLabels={getRowLabels}
      />,
    );

    expect(html).toContain("Init.");
    expect(html).toContain(PLAYER_TRACKER_GRID_TEMPLATE_COLUMNS);
    expect(html).not.toContain("Aff.");
    expect(html).not.toContain('aria-label="Configure display"');
  });
});
