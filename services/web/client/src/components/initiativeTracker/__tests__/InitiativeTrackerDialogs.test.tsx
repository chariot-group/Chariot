import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

// Render dialog parts inline (no portal) so the static markup can be inspected.
vi.mock("@/components/ui/dialog", () => {
  const passthrough = (slot: string) => {
    function DialogPart({ children, className }: { children?: ReactNode; className?: string }) {
      return (
        <div
          data-slot={slot}
          className={className}>
          {children}
        </div>
      );
    }
    return DialogPart;
  };
  return {
    Dialog: ({ children }: { children?: ReactNode }) => <>{children}</>,
    DialogContent: passthrough("dialog-content"),
    DialogHeader: passthrough("dialog-header"),
    DialogFooter: passthrough("dialog-footer"),
    DialogTitle: passthrough("dialog-title"),
    DialogDescription: passthrough("dialog-description"),
  };
});

import { InitiativeTrackerBulkVisibilityDialog } from "@/components/initiativeTracker/InitiativeTrackerBulkVisibilityDialog";
import { InitiativeTrackerVisibilityDialog } from "@/components/initiativeTracker/InitiativeTrackerVisibilityDialog";
import { deriveBulkVisibilitySummary } from "@/components/initiativeTracker/bulkSelection";
import type { InitiativeTrackerRow } from "@/store/slices/sessionSlice";

const fields = {
  initiative: "Initiative",
  name: "Name",
  hitPoints: "Hit points",
  lifeStatus: "Vital status",
  armorClass: "Armor class",
  conditions: "Conditions",
  concentration: "Concentration",
  groupLabel: "Group",
};

const row: InitiativeTrackerRow = {
  id: "row-1",
  characterId: "character-1",
  groupId: "group-1",
  groupLabel: "Goblins",
  firstname: "Snik",
  lastname: "",
  surname: "",
  initiative: 12,
  initiativeModifier: 2,
  hitPoints: 7,
  maxHitPoints: 7,
  tempHitPoints: 0,
  armorClass: 15,
  visible: true,
  playerDisplayName: "Snik",
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

const buttonTag = (html: string, label: string) =>
  (html.match(/<button[^>]*>[^<]*/g) ?? []).find((tag) => tag.endsWith(`>${label}`)) ?? "";

const renderBulk = (selectedCount: number) =>
  renderToStaticMarkup(
    <InitiativeTrackerBulkVisibilityDialog
      open
      selectedCount={selectedCount}
      selectionSummary={selectedCount > 0 ? deriveBulkVisibilitySummary([row]) : null}
      labels={{
        title: "Display configuration",
        description: "Shared display settings",
        showToPlayers: "Show to players",
        playerDisplayName: "Alias",
        playerDisplayNameHint: "Hint",
        playerDisplayNamePlaceholder: "Placeholder",
        fieldsTitle: "Fields",
        emptySelection: "Select at least one row",
        configure: "Configure",
        accept: "Accept",
        cancel: "Cancel",
        leaveInitiative: "Leave initiative",
        fields,
      }}
      onOpenChange={() => undefined}
      onApply={() => undefined}
      onLeaveInitiative={() => undefined}
    />,
  );

describe("FR-tracker-bulk-actions — grouped display dialog", () => {
  it("nominal: validated by a text-only Accept button; leave initiative is the danger button", () => {
    const html = renderBulk(2);
    const accept = html.slice(html.indexOf('data-slot="dialog-footer"'));

    expect(buttonTag(html, "Accept")).not.toBe("");
    expect(accept).not.toContain("<svg");
    expect(html).not.toContain(">Configure<");
    expect(buttonTag(html, "Leave initiative")).toContain('data-variant="destructive"');
  });

  it("edge: header and footer are split from the body by the layout line", () => {
    const html = renderBulk(2);
    const header = html.slice(html.indexOf('data-slot="dialog-header"'), html.indexOf("</div>", html.indexOf('data-slot="dialog-header"')));

    // The header holds the title only; the description opens the body.
    expect(header).not.toContain("Shared display settings");
    expect(html.indexOf("Shared display settings")).toBeGreaterThan(html.indexOf('data-slot="dialog-header"'));

    expect(html).toMatch(/data-slot="dialog-header" class="[^"]*border-b border-frame/);
    expect(html).toMatch(/data-slot="dialog-footer" class="[^"]*border-t border-frame/);
    expect(html).not.toContain("border-white/10");
  });

  it("failure: without selection, accept and leave initiative are disabled", () => {
    const html = renderBulk(0);

    expect(buttonTag(html, "Accept")).toContain('disabled=""');
    expect(buttonTag(html, "Leave initiative")).toContain('disabled=""');
    expect(html).toContain("Select at least one row");
  });
});

describe("FR-combat-initiative-tracker — per-row display dialog", () => {
  const labels = {
    title: "Display",
    showToPlayers: "Show to players",
    playerDisplayName: "Alias",
    playerDisplayNameHint: "Hint",
    playerDisplayNamePlaceholder: "Placeholder",
    playerRowVisibilityHint: "Participant hint",
    leaveInitiative: "Leave initiative",
    fields,
    apply: "Apply",
    cancel: "Cancel",
    configureFor: "Configure Snik",
  };

  it("nominal: leave initiative is the default danger button, footer split by the layout line", () => {
    const html = renderToStaticMarkup(
      <InitiativeTrackerVisibilityDialog
        row={row}
        open
        onOpenChange={() => undefined}
        labels={labels}
        onApply={() => undefined}
        onLeaveInitiative={() => undefined}
      />,
    );

    const header = html.slice(html.indexOf('data-slot="dialog-header"'), html.indexOf("</div>", html.indexOf('data-slot="dialog-header"')));
    expect(header).not.toContain("Configure Snik");
    expect(html).toContain("Configure Snik");
    const leave = buttonTag(html, "Leave initiative");
    expect(leave).toContain('data-variant="destructive"');
    // No bordered box inside the body.
    expect(html).not.toContain("border-white/10");
    expect(leave).not.toContain("text-red");
    expect(html).toMatch(/data-slot="dialog-footer" class="[^"]*border-t border-frame/);
  });

  it("guard: no leave initiative button without the action", () => {
    const html = renderToStaticMarkup(
      <InitiativeTrackerVisibilityDialog
        row={row}
        open
        onOpenChange={() => undefined}
        labels={labels}
        onApply={() => undefined}
      />,
    );

    expect(html).not.toContain("Leave initiative");
  });
});
