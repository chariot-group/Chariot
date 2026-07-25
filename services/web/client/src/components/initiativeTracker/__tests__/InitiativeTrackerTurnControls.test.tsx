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
