"use client";

import { ChevronLeft, ChevronRight, OctagonX, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type PreviousTurnState = "available" | "noPreviousTurn" | "currentTurnLocked";

type InitiativeTrackerTurnControlsProps = {
  battleStarted: boolean;
  canGoPrevious: boolean;
  previousTurnState: PreviousTurnState;
  labels: {
    startCombat: string;
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
  };
  onStartCombat: () => void;
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

export function InitiativeTrackerTurnControls({
  battleStarted,
  canGoPrevious,
  previousTurnState,
  labels,
  onStartCombat,
  onEndCombat,
  onPrevious,
  onNext,
}: InitiativeTrackerTurnControlsProps) {
  const previousHint = getPreviousHint(previousTurnState, labels);

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                type="button"
                variant="outline"
                disabled={!battleStarted || !canGoPrevious}
                aria-label={labels.previous}
                onClick={onPrevious}
                className="h-9 rounded-[15px] border-white/20 bg-gray px-3 text-sm font-medium text-white hover:bg-gray-middle-light disabled:opacity-40 sm:min-w-0">
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
              aria-label={labels.endCombat}
              className="h-9 rounded-[15px] bg-red px-3 text-sm font-semibold text-white hover:bg-[#e02020] sm:px-4">
              <OctagonX className="size-4 sm:hidden" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{labels.endCombat}</span>
            </Button>
          </ConfirmDialog>
        ) : (
          <Button
            type="button"
            onClick={onStartCombat}
            aria-label={labels.startCombat}
            className="h-9 rounded-[15px] bg-green px-3 text-sm font-semibold text-black hover:bg-[#7dc400] sm:px-4">
            <Play className="size-4 sm:hidden" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{labels.startCombat}</span>
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          disabled={!battleStarted}
          aria-label={labels.next}
          onClick={onNext}
          className="h-9 rounded-[15px] border-white/20 bg-gray px-3 text-sm font-medium text-white hover:bg-gray-middle-light disabled:opacity-40">
          <span className="sr-only sm:not-sr-only">{labels.next}</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
