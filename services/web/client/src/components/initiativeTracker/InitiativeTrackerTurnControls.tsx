"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type PreviousTurnState = "available" | "noPreviousTurn" | "currentTurnLocked";

type InitiativeTrackerTurnControlsProps = {
  battleStarted: boolean;
  canGoPrevious: boolean;
  previousTurnState: PreviousTurnState;
  labels: {
    startCombat: string;
    endCombat: string;
    previous: string;
    next: string;
    previousHintAvailable: string;
    previousHintLocked: string;
    previousHintNoPrevious: string;
    turnUndoAvailable: string;
    turnCurrentLocked: string;
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
  const turnStatusLabel =
    previousTurnState === "available"
      ? labels.turnUndoAvailable
      : previousTurnState === "currentTurnLocked"
        ? labels.turnCurrentLocked
        : null;

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
                aria-describedby={battleStarted ? "initiative-tracker-turn-status" : undefined}
                onClick={onPrevious}
                className="h-9 rounded-[15px] border-white/20 bg-gray px-3 text-sm font-medium text-white hover:bg-gray-middle-light disabled:opacity-40">
                <ChevronLeft className="size-4" />
                {labels.previous}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-center">{previousHint}</TooltipContent>
        </Tooltip>

        <Button
          type="button"
          onClick={battleStarted ? onEndCombat : onStartCombat}
          className={
            battleStarted
              ? "h-9 rounded-[15px] bg-red px-4 text-sm font-semibold text-white hover:bg-[#e02020]"
              : "h-9 rounded-[15px] bg-green px-4 text-sm font-semibold text-black hover:bg-[#7dc400]"
          }>
          {battleStarted ? labels.endCombat : labels.startCombat}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!battleStarted}
          aria-label={labels.next}
          onClick={onNext}
          className="h-9 rounded-[15px] border-white/20 bg-gray px-3 text-sm font-medium text-white hover:bg-gray-middle-light disabled:opacity-40">
          {labels.next}
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {battleStarted && turnStatusLabel && (
        <p
          id="initiative-tracker-turn-status"
          className={`text-xs ${previousTurnState === "available" ? "text-white/65" : "text-white/45"}`}>
          {turnStatusLabel}
        </p>
      )}
    </div>
  );
}
