"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type InitiativeTrackerTurnControlsProps = {
  battleStarted: boolean;
  canGoPrevious: boolean;
  labels: {
    startCombat: string;
    endCombat: string;
    previous: string;
    next: string;
  };
  onStartCombat: () => void;
  onEndCombat: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function InitiativeTrackerTurnControls({
  battleStarted,
  canGoPrevious,
  labels,
  onStartCombat,
  onEndCombat,
  onPrevious,
  onNext,
}: InitiativeTrackerTurnControlsProps) {
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={!battleStarted || !canGoPrevious}
        aria-label={labels.previous}
        onClick={onPrevious}
        className="h-9 rounded-[15px] border-white/20 bg-gray px-3 text-sm font-medium text-white hover:bg-gray-middle-light disabled:opacity-40">
        <ChevronLeft className="size-4" />
        {labels.previous}
      </Button>

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
  );
}
