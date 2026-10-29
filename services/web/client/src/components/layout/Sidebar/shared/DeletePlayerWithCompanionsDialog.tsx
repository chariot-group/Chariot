"use client";

/** @see FR-player-delete-companion-choice */

import * as React from "react";
import { Loader2, Trash2, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { characterDisplayName } from "@/lib/duplicateName";
import { companionNamesLine } from "@/lib/sessionPlayerCompanions";
import { cn } from "@/lib/utils";
import type { NPC } from "@/types/character";

export interface DeletePlayerWithCompanionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string;
  companions: NPC[];
  isLoading?: boolean;
  isLoadingCompanions?: boolean;
  title: string;
  description: string;
  companionsListLabel: string;
  choiceLegend: string;
  cancelLabel: string;
  keepCompanionsLabel: string;
  deleteAllLabel: string;
  keepCompanionsHint: string;
  deleteAllHint: string;
  keepCompanionsAriaLabel: string;
  deleteAllAriaLabel: string;
  onKeepCompanions: () => void | Promise<void>;
  onDeleteWithCompanions: () => void | Promise<void>;
}

const choiceCardClassName =
  "flex w-full min-w-0 cursor-pointer items-start gap-3 rounded-[15px] border border-white/15 bg-gray-middle-light px-3 py-2.5 text-left transition-colors hover:bg-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

export function DeletePlayerWithCompanionsDialog({
  open,
  onOpenChange,
  playerName,
  companions,
  isLoading = false,
  isLoadingCompanions = false,
  title,
  description,
  companionsListLabel,
  choiceLegend,
  cancelLabel,
  keepCompanionsLabel,
  deleteAllLabel,
  keepCompanionsHint,
  deleteAllHint,
  keepCompanionsAriaLabel,
  deleteAllAriaLabel,
  onKeepCompanions,
  onDeleteWithCompanions,
}: DeletePlayerWithCompanionsDialogProps) {
  const sortedCompanions = React.useMemo(
    () =>
      [...companions].sort((left, right) =>
        characterDisplayName(left).localeCompare(characterDisplayName(right), undefined, {
          sensitivity: "base",
        }),
      ),
    [companions],
  );

  const companionSummary = React.useMemo(
    () => companionNamesLine(sortedCompanions),
    [sortedCompanions],
  );

  const actionsDisabled = isLoading || isLoadingCompanions;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isLoading) return;
        onOpenChange(nextOpen);
      }}>
      <DialogContent
        className="rounded-[15px] bg-card sm:max-w-sm"
        onEscapeKeyDown={(event) => {
          if (isLoading) event.preventDefault();
        }}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isLoadingCompanions ? (
          <div
            className="flex justify-center py-3"
            aria-busy="true">
            <Loader2
              className="h-5 w-5 animate-spin text-white/70"
              aria-hidden="true"
            />
            <span className="sr-only">{playerName}</span>
          </div>
        ) : (
          <>
            <fieldset className="min-w-0 space-y-1.5">
              <legend className="text-xs font-semibold text-white/70">
                {companionsListLabel} ({sortedCompanions.length})
              </legend>
              <div className="max-h-24 overflow-y-auto rounded-[12px] border border-white/10 bg-gray-middle-light/40 px-3 py-2 pr-2">
                <p
                  className="text-xs leading-relaxed text-white/70"
                  title={companionSummary}>
                  {companionSummary}
                </p>
              </div>
            </fieldset>

            <fieldset
              className="flex flex-col gap-2"
              disabled={actionsDisabled}>
              <legend className="sr-only">{choiceLegend}</legend>
              <button
                type="button"
                className={choiceCardClassName}
                aria-label={keepCompanionsAriaLabel}
                disabled={actionsDisabled}
                onClick={() => void onKeepCompanions()}>
                <UserRound
                  className="mt-0.5 size-5 shrink-0 text-blue"
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">{keepCompanionsLabel}</span>
                  <span className="block text-xs text-white/70">{keepCompanionsHint}</span>
                </span>
              </button>
              <button
                type="button"
                className={cn(choiceCardClassName, "hover:border-red/40")}
                aria-label={deleteAllAriaLabel}
                disabled={actionsDisabled}
                onClick={() => void onDeleteWithCompanions()}>
                <Trash2
                  className="mt-0.5 size-5 shrink-0 text-red"
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">{deleteAllLabel}</span>
                  <span className="block text-xs text-white/70">{deleteAllHint}</span>
                </span>
              </button>
            </fieldset>
          </>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
