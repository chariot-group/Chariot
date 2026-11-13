"use client";

import { ChevronLeft, ChevronRight, OctagonX, Play, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type PreviousTurnState = "available" | "noPreviousTurn" | "currentTurnLocked";

type InitiativeTrackerTurnControlsProps = {
  battleStarted: boolean;
  canGoPrevious: boolean;
  previousTurnState: PreviousTurnState;
  /** FR-combat-initiative-tracker — rows still without initiative before combat start. */
  missingInitiativeCount?: number;
  labels: {
    startCombat: string;
    cancelCombat: string;
    cancelCombatConfirmTitle: string;
    cancelCombatConfirmDescription: string;
    cancelCombatConfirmAction: string;
    cancelCombatCancelAction: string;
    endCombat: string;
    endCombatConfirmTitle: string;
    endCombatConfirmDescription: string;
    endCombatConfirmAction: string;
    endCombatCancelAction: string;
    previous: string;
    next: string;
    previousHintAvailable: string;
    previousHintLocked: string;
    previousHintNoPrevious: string;
    prepHint?: string;
    getMissingInitiativesLabel?: (count: number) => string;
    allInitiativesEntered?: string;
    startMissingConfirmTitle?: string;
    getStartMissingConfirmDescription?: (count: number) => string;
    startMissingConfirmAction?: string;
    startMissingCancelAction?: string;
  };
  onStartCombat: () => void;
  onCancelCombat: () => void;
  onEndCombat: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

function getPreviousHint(previousTurnState: PreviousTurnState, labels: InitiativeTrackerTurnControlsProps["labels"]) {
  switch (previousTurnState) {
    case "available":
      return labels.previousHintAvailable;
    case "currentTurnLocked":
      return labels.previousHintLocked;
    case "noPreviousTurn":
      return labels.previousHintNoPrevious;
  }
}

/**
 * FR-combat-initiative-tracker — start / cancel (pre-start) / end combat + turn nav.
 */
export function InitiativeTrackerTurnControls({
  battleStarted,
  canGoPrevious,
  previousTurnState,
  missingInitiativeCount = 0,
  labels,
  onStartCombat,
  onCancelCombat,
  onEndCombat,
  onPrevious,
  onNext,
}: InitiativeTrackerTurnControlsProps) {
  const previousHint = getPreviousHint(previousTurnState, labels);
  const confirmMissingStart =
    missingInitiativeCount > 0 && labels.startMissingConfirmTitle != null && labels.getStartMissingConfirmDescription != null;
  const prepStatus =
    missingInitiativeCount > 0 ? labels.getMissingInitiativesLabel?.(missingInitiativeCount) : labels.allInitiativesEntered;

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                type="button"
                variant="secondary"
                disabled={!battleStarted || !canGoPrevious}
                aria-label={labels.previous}
                onClick={onPrevious}
                className="min-w-[4.5rem] px-5 sm:min-w-0 sm:px-3">
                <ChevronLeft className="size-4" />
                <span className="sr-only sm:not-sr-only">{labels.previous}</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-center">{previousHint}</TooltipContent>
        </Tooltip>

        {battleStarted ? (
          <ConfirmDialog
            title={labels.endCombatConfirmTitle}
            description={labels.endCombatConfirmDescription}
            confirmLabel={labels.endCombatConfirmAction}
            cancelLabel={labels.endCombatCancelAction}
            onConfirm={onEndCombat}>
            <Button
              type="button"
              variant="destructive"
              aria-label={labels.endCombat}
              className="min-w-[4.5rem] px-5 sm:min-w-0 sm:px-4">
              <OctagonX
                className="size-4 sm:hidden"
                aria-hidden="true"
              />
              <span className="sr-only sm:not-sr-only">{labels.endCombat}</span>
            </Button>
          </ConfirmDialog>
        ) : (
          <>
            <ConfirmDialog
              title={labels.cancelCombatConfirmTitle}
              description={labels.cancelCombatConfirmDescription}
              confirmLabel={labels.cancelCombatConfirmAction}
              cancelLabel={labels.cancelCombatCancelAction}
              onConfirm={onCancelCombat}>
              <Button
                type="button"
                variant="secondary"
                aria-label={labels.cancelCombat}
                className="min-w-[4.5rem] border-red/50 bg-transparent px-5 text-red hover:bg-red/15 sm:min-w-0 sm:px-4">
                <XCircle
                  className="size-4 sm:hidden"
                  aria-hidden="true"
                />
                <span className="sr-only sm:not-sr-only">{labels.cancelCombat}</span>
              </Button>
            </ConfirmDialog>
            {confirmMissingStart ? (
              <ConfirmDialog
                title={labels.startMissingConfirmTitle ?? ""}
                description={labels.getStartMissingConfirmDescription?.(missingInitiativeCount) ?? ""}
                confirmLabel={labels.startMissingConfirmAction ?? labels.startCombat}
                cancelLabel={labels.startMissingCancelAction ?? labels.cancelCombatCancelAction}
                confirmVariant="primary"
                onConfirm={onStartCombat}>
            <Button
              type="button"
              onClick={confirmMissingStart ? undefined : onStartCombat}
              variant="accent"
              tone="green"
              aria-label={labels.startCombat}
              className="min-w-[4.5rem] px-5 sm:min-w-0 sm:px-4">
              <Play
                className="size-4 sm:hidden"
                aria-hidden="true"
              />
              <span className="sr-only sm:not-sr-only">{labels.startCombat}</span>
            </Button>
              </ConfirmDialog>
            ) : (
            <Button
              type="button"
              onClick={confirmMissingStart ? undefined : onStartCombat}
              variant="accent"
              tone="green"
              aria-label={labels.startCombat}
              className="min-w-[4.5rem] px-5 sm:min-w-0 sm:px-4">
              <Play
                className="size-4 sm:hidden"
                aria-hidden="true"
              />
              <span className="sr-only sm:not-sr-only">{labels.startCombat}</span>
            </Button>
            )}
          </>
        )}

        <Button
          type="button"
          variant="secondary"
          disabled={!battleStarted}
          aria-label={labels.next}
          onClick={onNext}
          className="min-w-[4.5rem] px-5 sm:min-w-0 sm:px-3">
          <span className="sr-only sm:not-sr-only">{labels.next}</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
      {!battleStarted && (labels.prepHint || prepStatus) ? (
        <p
          className="text-center text-sm text-white/70"
          role="status"
          aria-live="polite">
          {labels.prepHint ? <span>{labels.prepHint} </span> : null}
          {prepStatus ? (
            <span className={missingInitiativeCount > 0 ? "font-semibold text-yellow" : "font-semibold text-green"}>
              {prepStatus}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
