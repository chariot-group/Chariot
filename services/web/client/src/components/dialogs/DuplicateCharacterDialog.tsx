"use client";

import * as React from "react";

/** Pure helper — exported for unit tests */
export function buildDuplicateName(character: { firstname: string; lastname?: string } | null): string {
  if (!character) return "2";
  const base = [character.firstname, character.lastname]
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean)
    .join(" ");
  return base ? `${base} 2` : "2";
}
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
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface DuplicateCharacterDialogProps {
  character: { firstname: string; lastname?: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDuplicate: (name: string) => Promise<void>;
  /** When provided, shows a secondary "Create in another group" button */
  onDuplicateAndMove?: (name: string) => Promise<void>;
}

export function DuplicateCharacterDialog({
  character,
  open,
  onOpenChange,
  onDuplicate,
  onDuplicateAndMove,
}: DuplicateCharacterDialogProps) {
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");

  const defaultName = React.useMemo(() => buildDuplicateName(character), [character]);

  const [name, setName] = React.useState(defaultName);
  const [isCreating, setIsCreating] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(defaultName);
      setIsCreating(false);
    }
  }, [open, defaultName]);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !isCreating;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setIsCreating(true);
    try {
      await onDuplicate(trimmedName);
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
      await onDuplicateAndMove(trimmedName);
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

        <div className="grid gap-2 py-2">
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
