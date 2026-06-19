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
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Group } from "@/types/campaign";
import { moveCharacterToGroup } from "@/lib/moveCharacterToGroup";
import { cn } from "@/lib/utils";

interface MoveCharacterDialogProps {
  character: { _id: string; firstname: string; lastname: string } | null;
  currentGroupId: string;
  targetGroups: Group[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoved?: (targetGroupId: string) => void | Promise<void>;
}

export function MoveCharacterDialog({
  character,
  currentGroupId,
  targetGroups,
  open,
  onOpenChange,
  onMoved,
}: MoveCharacterDialogProps) {
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);
  const [isMoving, setIsMoving] = React.useState(false);

  const availableGroups = React.useMemo(
    () => targetGroups.filter((group) => group._id !== currentGroupId),
    [currentGroupId, targetGroups],
  );

  React.useEffect(() => {
    if (open) {
      setSelectedGroupId(availableGroups[0]?._id ?? null);
    }
  }, [availableGroups, open]);

  const handleMove = async () => {
    if (!character || !selectedGroupId || isMoving) return;

    setIsMoving(true);
    try {
      await moveCharacterToGroup(character._id, currentGroupId, selectedGroupId);
      await onMoved?.(selectedGroupId);
      onOpenChange(false);
    } catch (error) {
      console.error("Error moving character:", error);
    } finally {
      setIsMoving(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !isMoving && selectedGroupId) {
      event.preventDefault();
      void handleMove();
    }
  };

  const displayName =
    [character?.firstname, character?.lastname]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean)
      .join(" ") || t("unnamedCharacter");

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isMoving) onOpenChange(false);
      }}>
      <DialogContent
        className="sm:max-w-md rounded-[15px] bg-card"
        onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{t("moveCharacterDialogTitle")}</DialogTitle>
          <DialogDescription>{t("moveCharacterDialogDescription", { name: displayName })}</DialogDescription>
        </DialogHeader>

        {availableGroups.length === 0 ? (
          <p className="text-sm text-white/60">{t("moveCharacterNoTargetGroups")}</p>
        ) : (
          <div className="grid gap-2 py-2">
            <Label>{t("moveCharacterSelectGroup")}</Label>
            <div
              className="flex max-h-48 flex-col gap-1 overflow-y-auto"
              role="listbox"
              aria-label={t("moveCharacterSelectGroup")}>
              {availableGroups.map((group) => {
                const isSelected = selectedGroupId === group._id;
                return (
                  <button
                    key={group._id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={isMoving}
                    onClick={() => setSelectedGroupId(group._id)}
                    className={cn(
                      "cursor-pointer rounded-[12px] px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50",
                      isSelected ? "bg-white font-semibold text-black" : "hover:bg-white/10",
                    )}>
                    {group.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isMoving}
            onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            disabled={isMoving || !selectedGroupId || availableGroups.length === 0}
            onClick={() => void handleMove()}>
            {isMoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("moveCharacterConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
