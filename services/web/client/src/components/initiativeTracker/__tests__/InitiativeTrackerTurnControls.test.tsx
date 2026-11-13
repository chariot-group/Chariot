import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InitiativeTrackerTurnControls } from "@/components/initiativeTracker/InitiativeTrackerTurnControls";

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
