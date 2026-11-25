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
  TrackerSelectedCount,
} from "@/components/initiativeTracker/InitiativeTrackerTable";
import {
  getTrackerGridTemplateColumns,
  PLAYER_TRACKER_GRID_TEMPLATE_COLUMNS,
  TRACKER_GRID_TEMPLATE_COLUMNS_WITH_SELECTION,
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
          action: "Grouped initiative",
          getSelectedCountLabel: (count) => `${count} selected`,
          initiativePlaceholder: "Initiative",
          apply: "Apply",
          clearSelection: "Clear",
          clearSelectionShort: "Clear",
          selectAllRows: "Select all rows",
          selectAllRowsShort: "All",
        }}
        bulkVisibilityLabels={{
          getSelectedCountLabel: (count) => `${count} selected`,
          selectAllRows: "Select all rows",
          selectAllRowsShort: "All",
          clearSelection: "Clear",
          clearSelectionShort: "Clear",
          selectionToolbar: "Selection actions",
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
          accept: "Accept",
          cancel: "Cancel",
          leaveInitiative: "Leave initiative",
          fields: {
            initiative: "Initiative",
            name: "Name",
            hitPoints: "Hit points",
            lifeStatus: "Vital status",
            armorClass: "Armor class",
            conditions: "Conditions",
            concentration: "Concentration",
            groupLabel: "Group",
          },
        }}
      />,
    );

    // FR-combat-initiative-tracker — one table card; headings left-aligned and muted.
    expect(html).toContain('data-slot="tracker-card"');
    expect(html).toContain("text-xs font-bold uppercase tracking-wide text-muted-foreground");
    expect(html).toContain("Init.");
    expect(html).toContain("Aff.");
    expect(html).toContain("Initiative");
    expect(html).toContain("Afficher");
    // FR-tracker-bulk-actions — select first, act next: select-all always visible, no per-action modes.
    expect(html).toContain('aria-label="Select all rows"');
    expect(html).not.toContain("aria-pressed");
    // Selection toolbar only appears once something is selected.
    expect(html).not.toContain('role="toolbar"');
    expect(html).toContain("md:hidden");
    expect(html).toContain(TRACKER_GRID_TEMPLATE_COLUMNS_WITH_SELECTION);
    expect(html).not.toContain("text-center");
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
    expect(html).not.toContain('aria-label="Select all rows"');
    // No GM tool: no header toolbar at all.
    expect(html).not.toContain('data-slot="tracker-toolbar"');
  });
});

describe("FR-combat-initiative-tracker — tracker table card", () => {
  it("nominal: header actions sit in the card toolbar and the footer closes the card", () => {
    const html = renderToStaticMarkup(
      <InitiativeTrackerTable
        rows={[]}
        mode="player"
        columnLabels={columnLabels}
        getRowLabels={getRowLabels}
        headerActions={<button type="button">Add combatants</button>}
        turnControls={<div data-testid="footer">Round 2</div>}
      />,
    );

    const card = html.indexOf('data-slot="tracker-card"');
    const toolbar = html.indexOf('data-slot="tracker-toolbar"');
    const headings = html.indexOf('data-slot="tracker-headings"');
    const rows = html.indexOf('data-slot="tracker-rows"');
    const footer = html.indexOf('data-testid="footer"');

    expect(card).toBeGreaterThan(-1);
    expect(toolbar).toBeGreaterThan(card);
    expect(html.indexOf("Add combatants")).toBeGreaterThan(toolbar);
    expect(headings).toBeGreaterThan(toolbar);
    expect(rows).toBeGreaterThan(headings);
    expect(footer).toBeGreaterThan(rows);
    // Rows area uses a lighter (raised) tone than the header and footer.
    expect(html).toMatch(/data-slot="tracker-rows" class="[^"]*bg-gray-middle-light/);
    expect(html.trimEnd().endsWith("</section>")).toBe(true);
  });

  it("edge: locked initiatives narrow the initiative column and keep the full label for assistive tech", () => {
    const html = renderToStaticMarkup(
      <InitiativeTrackerTable
        rows={[]}
        mode="player"
        initiativeLocked
        columnLabels={columnLabels}
        getRowLabels={getRowLabels}
      />,
    );

    expect(html).toContain(
      getTrackerGridTemplateColumns({ selection: false, visibility: false, initiativeEditable: false }),
    );
    expect(html).not.toContain(PLAYER_TRACKER_GRID_TEMPLATE_COLUMNS);
    expect(html).toContain('<span class="sr-only">Initiative</span>');
  });
});

describe("FR-tracker-bulk-actions — selected count in the header toolbar", () => {
  it("nominal: mobile shows the number alone, md and up the full label", () => {
    const html = renderToStaticMarkup(
      <TrackerSelectedCount
        count={8}
        label="8 characters selected"
      />,
    );

    expect(html).toContain('<span class="md:hidden" aria-hidden="true">8</span>');
    expect(html).toContain('<span class="hidden md:inline" aria-hidden="true">8 characters selected</span>');
  });

  it("edge: assistive tech always gets the full label", () => {
    const html = renderToStaticMarkup(
      <TrackerSelectedCount
        count={1}
        label="1 character selected"
      />,
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('<span class="sr-only">1 character selected</span>');
  });
});
