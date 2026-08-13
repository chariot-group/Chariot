"use client";

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
import { characterDisplayName, nextAvailableDuplicateName } from "@/lib/duplicateName";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

/** Pure helper — exported for unit tests */
export function buildDuplicateName(
  character: { firstname: string; lastname?: string } | null,
  existingNames: readonly string[] = [],
): string {
  return nextAvailableDuplicateName(characterDisplayName(character), existingNames);
}

interface DuplicateCharacterDialogProps {
  character: { firstname: string; lastname?: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDuplicate: (name: string, count: number) => Promise<void>;
  /** Visible character display names used to pick the next free suffix */
  existingNames?: readonly string[];
  /** When provided, shows a secondary "Create in another group" button */
  onDuplicateAndMove?: (name: string, count: number) => Promise<void>;
}

export function DuplicateCharacterDialog({
  character,
  open,
  onOpenChange,
  onDuplicate,
  existingNames = [],
  onDuplicateAndMove,
}: DuplicateCharacterDialogProps) {
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");

  const defaultName = React.useMemo(
    () => buildDuplicateName(character, existingNames),
    [character, existingNames],
  );

  const [name, setName] = React.useState(defaultName);
  const [countStr, setCountStr] = React.useState("1");
  const [isCreating, setIsCreating] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(defaultName);
      setCountStr("1");
      setIsCreating(false);
    }
  }, [open, defaultName]);

  const count = Math.max(1, Math.min(99, parseInt(countStr, 10) || 1));

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !isCreating;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setIsCreating(true);
    try {
      await onDuplicate(trimmedName, count);
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
      await onDuplicateAndMove(trimmedName, count);
      onOpenChange(false);
    } catch {
      // error toast handled by caller
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
          <DialogDescription>{t("duplicateCharacterDialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-3 py-2">
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

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={isCreating}
            onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>

          {onDuplicateAndMove && (
            <Button
              type="button"
              variant="outline"
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
