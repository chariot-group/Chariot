"use client";

/** @see FR-character-duplicate, FR-player-duplicate-companion-choice */

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompanionLinkedInlineList } from "@/components/character/CompanionLinkedInlineList";
import { characterDisplayName, nextAvailableDuplicateName } from "@/lib/duplicateName";
import type { PlayerDuplicateCompanionMode } from "@/lib/playerDuplicateCompanions";
import { companionNamesLine } from "@/lib/sessionPlayerCompanions";
import { cn } from "@/lib/utils";
import type { NPC } from "@/types/character";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

/** Pure helper — exported for unit tests */
export function buildDuplicateName(
  character: { firstname: string; lastname?: string } | null,
  existingNames: readonly string[] = [],
): string {
  return nextAvailableDuplicateName(characterDisplayName(character), existingNames);
}

const companionChoiceRowClass =
  "flex w-full min-w-0 cursor-pointer items-start gap-2 rounded-md py-1.5 text-left has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-card disabled:cursor-not-allowed disabled:opacity-50";

interface DuplicateCharacterDialogProps {
  character: { firstname: string; lastname?: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDuplicate: (name: string, count: number, companionMode: PlayerDuplicateCompanionMode) => Promise<void>;
  /** Visible character display names used to pick the next free suffix */
  existingNames?: readonly string[];
  /** When provided, shows a secondary "Create in another group" button */
  onDuplicateAndMove?: (
    name: string,
    count: number,
    companionMode: PlayerDuplicateCompanionMode,
  ) => Promise<void>;
  /** Linked companions — when non-empty, shows companion outcome choices */
  companions?: NPC[];
  isLoadingCompanions?: boolean;
}

export function DuplicateCharacterDialog({
  character,
  open,
  onOpenChange,
  onDuplicate,
  existingNames = [],
  onDuplicateAndMove,
  companions = [],
  isLoadingCompanions = false,
}: DuplicateCharacterDialogProps) {
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");

  const defaultName = React.useMemo(
    () => buildDuplicateName(character, existingNames),
    [character, existingNames],
  );

  const [name, setName] = React.useState(defaultName);
  const [countStr, setCountStr] = React.useState("1");
  const [companionMode, setCompanionMode] = React.useState<PlayerDuplicateCompanionMode>("playerOnly");
  const [isCreating, setIsCreating] = React.useState(false);

  const showCompanionChoices = companions.length > 0;

  React.useEffect(() => {
    if (open) {
      setName(defaultName);
      setCountStr("1");
      setCompanionMode("playerOnly");
      setIsCreating(false);
    }
  }, [open, defaultName]);

  const count = Math.max(1, Math.min(99, parseInt(countStr, 10) || 1));
  const moveCompanionsDisabled = count > 1;

  React.useEffect(() => {
    if (moveCompanionsDisabled && companionMode === "moveCompanions") {
      setCompanionMode("playerOnly");
    }
  }, [moveCompanionsDisabled, companionMode]);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !isCreating && !isLoadingCompanions;

  const sortedCompanionSummary = React.useMemo(() => {
    const sorted = [...companions].sort((left, right) =>
      characterDisplayName(left).localeCompare(characterDisplayName(right), undefined, {
        sensitivity: "base",
      }),
    );
    return companionNamesLine(sorted);
  }, [companions]);

  const handleCreate = async () => {
    if (!canSubmit) return;
    setIsCreating(true);
    try {
      await onDuplicate(trimmedName, count, companionMode);
      onOpenChange(false);
    } catch {
      // error toast handled by caller
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateAndMove = async () => {
    if (!canSubmit || !onDuplicateAndMove) return;
    setIsCreating(true);
    try {
      await onDuplicateAndMove(trimmedName, count, companionMode);
      onOpenChange(false);
    } catch {
      // error toast handled by caller
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCompanionChoices) return;
    if (e.key === "Enter" && canSubmit) {
      e.preventDefault();
      void handleCreate();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isCreating) onOpenChange(false);
      }}>
      <DialogContent className="sm:max-w-md rounded-[15px] bg-card">
        <DialogHeader>
          <DialogTitle>{t("duplicateCharacterDialogTitle")}</DialogTitle>
          <DialogDescription>
            {showCompanionChoices
              ? t("duplicatePlayerWithCompanionsDescription")
              : t("duplicateCharacterDialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-3">
          <div className="flex-1 grid gap-2">
            <Label htmlFor="duplicate-character-name">{t("duplicateCharacterNameLabel")}</Label>
            <Input
              id="duplicate-character-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              disabled={isCreating}
              className="rounded-[12px]"
              aria-label={t("duplicateCharacterNameLabel")}
            />
          </div>
          <div className="w-20 grid gap-2">
            <Label htmlFor="duplicate-character-count">{t("duplicateCharacterCountLabel")}</Label>
            <Input
              id="duplicate-character-count"
              type="number"
              min={1}
              max={99}
              value={countStr}
              onChange={(e) => setCountStr(e.target.value)}
              onBlur={() => setCountStr(String(count))}
              disabled={isCreating}
              className="rounded-[12px]"
              aria-label={t("duplicateCharacterCountLabel")}
            />
          </div>
        </div>

        {showCompanionChoices ? (
          isLoadingCompanions ? (
            <div
              className="flex justify-center py-3"
              aria-busy="true">
              <Loader2
                className="h-5 w-5 animate-spin text-white/70"
                aria-hidden="true"
              />
            </div>
          ) : (
            <div className="flex min-w-0 flex-col gap-3">
              <CompanionLinkedInlineList
                label={t("duplicatePlayerWithCompanionsListLabel")}
                count={companions.length}
                namesLine={sortedCompanionSummary}
              />

              <fieldset
                className="m-0 flex min-w-0 flex-col gap-1 border-0 p-0"
                disabled={isCreating}>
                <legend className="mb-1 text-sm font-semibold text-white/80">
                  {t("duplicatePlayerWithCompanionsChoiceLegend")}
                </legend>

                <label className={companionChoiceRowClass}>
                  <input
                    type="radio"
                    name="duplicate-companion-mode"
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                    checked={companionMode === "playerOnly"}
                    onChange={() => setCompanionMode("playerOnly")}
                    aria-label={t("duplicatePlayerOnlyAria")}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white">
                      {t("duplicatePlayerOnly")}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-white/70">
                      {t("duplicatePlayerOnlyHint")}
                    </span>
                  </span>
                </label>

                <label className={companionChoiceRowClass}>
                  <input
                    type="radio"
                    name="duplicate-companion-mode"
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                    checked={companionMode === "copyCompanions"}
                    onChange={() => setCompanionMode("copyCompanions")}
                    aria-label={t("duplicatePlayerAndCompanionsAria")}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white">
                      {t("duplicatePlayerAndCompanions")}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-white/70">
                      {t("duplicatePlayerAndCompanionsHint")}
                    </span>
                  </span>
                </label>

                <label
                  className={cn(
                    companionChoiceRowClass,
                    moveCompanionsDisabled && "cursor-not-allowed opacity-50",
                  )}>
                  <input
                    type="radio"
                    name="duplicate-companion-mode"
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                    checked={companionMode === "moveCompanions"}
                    disabled={moveCompanionsDisabled}
                    onChange={() => setCompanionMode("moveCompanions")}
                    aria-label={t("duplicatePlayerMoveCompanionsAria")}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white">
                      {t("duplicatePlayerMoveCompanions")}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-white/70">
                      {moveCompanionsDisabled
                        ? t("duplicatePlayerMoveCompanionsDisabledHint")
                        : t("duplicatePlayerMoveCompanionsHint")}
                    </span>
                  </span>
                </label>
              </fieldset>
            </div>
          )
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            disabled={isCreating}
            onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>

          {onDuplicateAndMove && (
            <Button
              type="button"
              variant="secondary"
              disabled={!canSubmit}
              onClick={() => void handleCreateAndMove()}>
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {t("duplicateCharacterCreateAndMove")}
            </Button>
          )}

          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleCreate()}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {t("duplicateCharacterCreate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
