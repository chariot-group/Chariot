"use client";

import { ChevronLeft, ChevronRight, Play, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  TRACKER_CARD_PADDING_X_CLASS,
  TRACKER_ZONE_PADDING_Y_CLASS,
} from "@/components/initiativeTracker/constants";
import { cn } from "@/lib/utils";

/**
 * Joined button group (documented exception of FR-frontend-button-system, docs/design.md 5.7):
 * one rounded frame, square inner segments, dividers between segments.
 */
const TURN_NAVIGATION_GROUP_CLASS =
  "inline-flex h-9 min-w-0 items-stretch overflow-hidden rounded-[13px] border border-input bg-gray-middle-light";
const TURN_NAVIGATION_SEGMENT_CLASS =
  "h-full rounded-none border-0 focus-visible:ring-inset focus-visible:ring-offset-0";

export type PreviousTurnState = "available" | "noPreviousTurn" | "currentTurnLocked";

type InitiativeTrackerTurnControlsProps = {
  battleStarted: boolean;
  /** FR-combat-initiative-tracker — round shown between previous and next once combat has started. */
  roundLabel: string;
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
    /** Short End combat label shown on mobile (e.g. « Clôturer »). */
    endCombatShort?: string;
    endCombatConfirmTitle: string;
    endCombatConfirmDescription: string;
    endCombatConfirmAction: string;
    endCombatCancelAction: string;
    previous: string;
    next: string;
    /** Accessible name of the previous | round | next group. */
    turnNavigation?: string;
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
 * FR-combat-initiative-tracker — tracker card footer: start / cancel (pre-start), then
 * `previous | round | next` on the left and end combat on the right.
 */
export function InitiativeTrackerTurnControls({
  battleStarted,
  roundLabel,
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

  const startButton = (
    <Button
      type="button"
      onClick={confirmMissingStart ? undefined : onStartCombat}
      variant="accent"
      tone="green"
      aria-label={labels.startCombat}
      className="min-w-[4.5rem] sm:min-w-0">
      <Play
        className="size-4 sm:hidden"
        aria-hidden="true"
      />
      <span className="sr-only sm:not-sr-only">{labels.startCombat}</span>
    </Button>
  );

  return (
    <div
      data-slot="tracker-footer"
      className={cn(
        "w-full min-w-0 gap-3",
        // Started: navigation left / end right on mobile; from `sm` three zones so previous | round | next
        // sits in the center of the footer.
        battleStarted
          ? "flex items-center justify-between sm:grid sm:grid-cols-[1fr_auto_1fr]"
          : "flex flex-wrap items-center justify-between",
        TRACKER_CARD_PADDING_X_CLASS,
        TRACKER_ZONE_PADDING_Y_CLASS,
      )}>
      {battleStarted ? (
        <span
          aria-hidden="true"
          className="hidden sm:block"
        />
      ) : null}
      {battleStarted ? (
        // FR-combat-initiative-tracker — joined control: previous | round | next.
        <div
          role="group"
          aria-label={labels.turnNavigation ?? roundLabel}
          className={cn(TURN_NAVIGATION_GROUP_CLASS, "sm:justify-self-center")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!canGoPrevious}
                  aria-label={labels.previous}
                  onClick={onPrevious}
                  className={TURN_NAVIGATION_SEGMENT_CLASS}>
                  <ChevronLeft
                    className="size-4"
                    aria-hidden="true"
                  />
                  <span className="sr-only sm:not-sr-only">{labels.previous}</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-center">{previousHint}</TooltipContent>
          </Tooltip>
          <span
            data-slot="tracker-round"
            role="status"
            aria-live="polite"
            className="flex items-center whitespace-nowrap border-x border-input px-3 text-sm font-semibold tabular-nums text-white">
            {roundLabel}
          </span>
          <Button
            type="button"
            variant="secondary"
            aria-label={labels.next}
            onClick={onNext}
            className={TURN_NAVIGATION_SEGMENT_CLASS}>
            <span className="sr-only sm:not-sr-only">{labels.next}</span>
            <ChevronRight
              className="size-4"
              aria-hidden="true"
            />
          </Button>
        </div>
      ) : labels.prepHint || prepStatus ? (
        <p
          className="min-w-0 flex-1 basis-64 text-sm text-white/70"
          role="status"
          aria-live="polite">
          {labels.prepHint ? <span>{labels.prepHint} </span> : null}
          {prepStatus ? (
            <span className={missingInitiativeCount > 0 ? "font-semibold text-yellow" : "font-semibold text-green"}>
              {prepStatus}
            </span>
          ) : null}
        </p>
      ) : (
        <span aria-hidden="true" />
      )}

      <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2 justify-self-end">
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
              aria-label={labels.endCombat}>
              {/* Mobile: short label so the footer stays on one line; full label from `sm`. */}
              <span
                className="sm:hidden"
                aria-hidden="true">
                {labels.endCombatShort ?? labels.endCombat}
              </span>
              <span
                className="hidden sm:inline"
                aria-hidden="true">
                {labels.endCombat}
              </span>
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
                className="min-w-[4.5rem] border-red/50 bg-transparent text-red hover:bg-red/15 sm:min-w-0">
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
                {startButton}
              </ConfirmDialog>
            ) : (
              startButton
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** FR-session-combat-navigation — read-only round shown to players in the tracker footer. */
export function InitiativeTrackerRoundFooter({ roundLabel }: { roundLabel: string }) {
  return (
    <div
      data-slot="tracker-footer"
      className={cn(
        "flex w-full min-w-0 items-center justify-center",
        TRACKER_CARD_PADDING_X_CLASS,
        TRACKER_ZONE_PADDING_Y_CLASS,
      )}>
      <span
        data-slot="tracker-round"
        role="status"
        aria-live="polite"
        className="text-sm font-semibold tabular-nums text-white">
        {roundLabel}
      </span>
    </div>
  );
}
