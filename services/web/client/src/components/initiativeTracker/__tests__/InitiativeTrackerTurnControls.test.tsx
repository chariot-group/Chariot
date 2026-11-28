import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  InitiativeTrackerRoundFooter,
  InitiativeTrackerTurnControls,
} from "@/components/initiativeTracker/InitiativeTrackerTurnControls";

const confirmHandlers: Array<() => void> = [];

vi.mock("@/components/ui/confirm-dialog", () => ({
  ConfirmDialog: ({
    children,
    onConfirm,
    title,
  }: {
    children: React.ReactNode;
    onConfirm: () => void;
    title: string;
  }) => {
    confirmHandlers.push(onConfirm);
    return (
      <div data-confirm-title={title}>
        {children}
      </div>
    );
  },
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const baseLabels = {
  startCombat: "Start combat",
  cancelCombat: "Cancel combat",
  cancelCombatConfirmTitle: "Cancel combat?",
  cancelCombatConfirmDescription: "Discard prep",
  cancelCombatConfirmAction: "Cancel combat",
  cancelCombatCancelAction: "Keep preparing",
  endCombat: "End combat",
  endCombatConfirmTitle: "Leave combat?",
  endCombatConfirmDescription: "Leave",
  endCombatConfirmAction: "Leave combat",
  endCombatCancelAction: "Stay",
  previous: "Previous",
  next: "Next",
  previousHintAvailable: "ok",
  previousHintLocked: "locked",
  previousHintNoPrevious: "none",
};

describe("FR-combat-initiative-tracker — cancel combat before start", () => {
  it("nominal: shows cancel and start before battle starts", () => {
    confirmHandlers.length = 0;
    const html = renderToStaticMarkup(
      <InitiativeTrackerTurnControls
        battleStarted={false}
        roundLabel="Round 3"
        canGoPrevious={false}
        previousTurnState="noPreviousTurn"
        labels={baseLabels}
        onStartCombat={() => undefined}
        onCancelCombat={() => undefined}
        onEndCombat={() => undefined}
        onPrevious={() => undefined}
        onNext={() => undefined}
      />,
    );

    expect(html).toContain('aria-label="Cancel combat"');
    expect(html).toContain('aria-label="Start combat"');
    expect(html).not.toContain('aria-label="End combat"');
    expect(html).toContain('data-confirm-title="Cancel combat?"');
  });

  it("edge: confirming cancel dialog invokes onCancelCombat without starting", () => {
    confirmHandlers.length = 0;
    const onCancelCombat = vi.fn();
    const onStartCombat = vi.fn();

    renderToStaticMarkup(
      <InitiativeTrackerTurnControls
        battleStarted={false}
        roundLabel="Round 3"
        canGoPrevious={false}
        previousTurnState="noPreviousTurn"
        labels={baseLabels}
        onStartCombat={onStartCombat}
        onCancelCombat={onCancelCombat}
        onEndCombat={() => undefined}
        onPrevious={() => undefined}
        onNext={() => undefined}
      />,
    );

    expect(confirmHandlers).toHaveLength(1);
    confirmHandlers[0]?.();
    expect(onCancelCombat).toHaveBeenCalledTimes(1);
    expect(onStartCombat).not.toHaveBeenCalled();
  });

  it("failure: end combat control is only available after start", () => {
    confirmHandlers.length = 0;
    const html = renderToStaticMarkup(
      <InitiativeTrackerTurnControls
        battleStarted={true}
        roundLabel="Round 3"
        canGoPrevious={false}
        previousTurnState="noPreviousTurn"
        labels={baseLabels}
        onStartCombat={() => undefined}
        onCancelCombat={() => undefined}
        onEndCombat={() => undefined}
        onPrevious={() => undefined}
        onNext={() => undefined}
      />,
    );

    expect(html).toContain('aria-label="End combat"');
    expect(html).not.toContain('aria-label="Cancel combat"');
    expect(html).not.toContain('aria-label="Start combat"');
    expect(html).toContain('data-confirm-title="Leave combat?"');
  });
});

describe("FR-combat-initiative-tracker — pre-combat initiative guidance", () => {
  const guidanceLabels = {
    ...baseLabels,
    prepHint: "Enter initiatives first.",
    getMissingInitiativesLabel: (count: number) => `${count} to enter`,
    allInitiativesEntered: "All entered",
    startMissingConfirmTitle: "Missing initiatives",
    getStartMissingConfirmDescription: (count: number) => `${count} missing`,
    startMissingConfirmAction: "Start anyway",
    startMissingCancelAction: "Back",
  };

  const render = (missingInitiativeCount: number, onStartCombat = vi.fn()) => {
    confirmHandlers.length = 0;
    const html = renderToStaticMarkup(
      <InitiativeTrackerTurnControls
        battleStarted={false}
        roundLabel="Round 3"
        canGoPrevious={false}
        previousTurnState="noPreviousTurn"
        missingInitiativeCount={missingInitiativeCount}
        labels={guidanceLabels}
        onStartCombat={onStartCombat}
        onCancelCombat={() => undefined}
        onEndCombat={() => undefined}
        onPrevious={() => undefined}
        onNext={() => undefined}
      />,
    );
    return { html, onStartCombat };
  };

  it("nominal: all initiatives entered starts directly, without confirmation", () => {
    const { html } = render(0);
    expect(html).toContain("All entered");
    expect(html).not.toContain('data-confirm-title="Missing initiatives"');
  });

  it("edge: missing initiatives show the counter and require a confirmation naming the count", () => {
    const { html, onStartCombat } = render(3);
    expect(html).toContain("3 to enter");
    expect(html).toContain("Enter initiatives first.");
    expect(html).toContain('data-confirm-title="Missing initiatives"');
    // cancel dialog first, then start-with-missing dialog
    expect(confirmHandlers).toHaveLength(2);
    confirmHandlers[1]?.();
    expect(onStartCombat).toHaveBeenCalledTimes(1);
  });

  it("failure: guidance is hidden once combat has started", () => {
    confirmHandlers.length = 0;
    const html = renderToStaticMarkup(
      <InitiativeTrackerTurnControls
        battleStarted
        roundLabel="Round 3"
        canGoPrevious={false}
        previousTurnState="noPreviousTurn"
        missingInitiativeCount={2}
        labels={guidanceLabels}
        onStartCombat={() => undefined}
        onCancelCombat={() => undefined}
        onEndCombat={() => undefined}
        onPrevious={() => undefined}
        onNext={() => undefined}
      />,
    );
    expect(html).not.toContain("2 to enter");
    expect(html).not.toContain("Enter initiatives first.");
  });
});

describe("FR-combat-initiative-tracker — table footer layout", () => {
  const renderControls = (battleStarted: boolean, canGoPrevious = true) =>
    renderToStaticMarkup(
      <InitiativeTrackerTurnControls
        battleStarted={battleStarted}
        roundLabel="Round 3"
        canGoPrevious={canGoPrevious}
        previousTurnState={canGoPrevious ? "available" : "currentTurnLocked"}
        labels={{ ...baseLabels, turnNavigation: "Turn navigation", endCombatShort: "End" }}
        onStartCombat={() => undefined}
        onCancelCombat={() => undefined}
        onEndCombat={() => undefined}
        onPrevious={() => undefined}
        onNext={() => undefined}
      />,
    );

  it("nominal: started combat shows previous | round | next, then end combat on the right", () => {
    const html = renderControls(true);
    const previous = html.indexOf('aria-label="Previous"');
    const round = html.indexOf("Round 3");
    const next = html.indexOf('aria-label="Next"');
    const end = html.indexOf('aria-label="End combat"');

    expect(html).toContain('role="group" aria-label="Turn navigation"');
    expect(previous).toBeGreaterThan(-1);
    expect(round).toBeGreaterThan(previous);
    expect(next).toBeGreaterThan(round);
    expect(end).toBeGreaterThan(next);
    // Three zones: the navigation group is centered in the footer.
    expect(html).toContain("sm:grid-cols-[1fr_auto_1fr]");
    expect(html).toMatch(/role="group" aria-label="Turn navigation" class="[^"]*sm:justify-self-center/);
  });

  it("edge: mobile footer keeps navigation left and a short end combat label right", () => {
    const html = renderControls(true);
    const footer = html.match(/<div data-slot="tracker-footer" class="([^"]*)"/)?.[1] ?? "";

    expect(footer).toContain("flex items-center justify-between");
    expect(html).toContain('<span class="sm:hidden" aria-hidden="true">End</span>');
    expect(html).toContain('<span class="hidden sm:inline" aria-hidden="true">End combat</span>');
    // Accessible name stays the full label.
    expect(html).toContain('aria-label="End combat"');
  });

  it("edge: locked turn disables previous only, next stays available", () => {
    const html = renderControls(true, false);
    const tags = html.match(/<button[^>]*>/g) ?? [];
    const previousTag = tags.find((tag) => tag.includes('aria-label="Previous"')) ?? "";
    const nextTag = tags.find((tag) => tag.includes('aria-label="Next"')) ?? "";

    expect(previousTag).toContain('disabled=""');
    expect(nextTag).not.toContain('disabled=""');
  });

  it("guard: no round and no turn navigation before combat start", () => {
    const html = renderControls(false);

    expect(html).not.toContain("Round 3");
    expect(html).not.toContain('aria-label="Previous"');
    expect(html).not.toContain('aria-label="Next"');
  });

  it("nominal: player footer shows the read-only round without controls", () => {
    const html = renderToStaticMarkup(<InitiativeTrackerRoundFooter roundLabel="Round 4" />);

    expect(html).toContain("Round 4");
    expect(html).toContain('role="status"');
    expect(html).not.toContain("<button");
  });
});
