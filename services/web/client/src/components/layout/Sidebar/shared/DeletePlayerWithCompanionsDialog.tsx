"use client";

/** @see FR-player-delete-companion-choice */

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CompanionLinkedInlineList } from "@/components/character/CompanionLinkedInlineList";
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
  cancelLabel: string;
  keepCompanionsLabel: string;
  deleteAllLabel: string;
  keepCompanionsAriaLabel: string;
  deleteAllAriaLabel: string;
  onKeepCompanions: () => void | Promise<void>;
  onDeleteWithCompanions: () => void | Promise<void>;
}

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
  cancelLabel,
  keepCompanionsLabel,
  deleteAllLabel,
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
        className="min-w-0 overflow-x-hidden rounded-[15px] bg-card sm:max-w-md"
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
          <CompanionLinkedInlineList
            label={companionsListLabel}
            count={sortedCompanions.length}
            namesLine={companionSummary}
          />
        )}

        <div className="flex w-full min-w-0 flex-col gap-2">
          <div className="grid w-full min-w-0 grid-cols-2 gap-2">
            <Button
              type="button"
              variant="destructive"
              className="min-w-0 px-3"
              disabled={actionsDisabled}
              aria-label={keepCompanionsAriaLabel}
              onClick={() => void onKeepCompanions()}>
              {isLoading ? (
                <Loader2
                  className="size-4 shrink-0 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              {keepCompanionsLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "min-w-0 px-3",
                "border-red/35 text-red hover:bg-red/10 hover:text-red dark:hover:bg-red/15",
              )}
              disabled={actionsDisabled}
              aria-label={deleteAllAriaLabel}
              onClick={() => void onDeleteWithCompanions()}>
              {isLoading ? (
                <Loader2
                  className="size-4 shrink-0 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              {deleteAllLabel}
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full min-w-0"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
