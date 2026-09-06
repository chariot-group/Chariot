"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PendingConcentrationCheck, TrackerConcentration } from "@/store/slices/sessionSlice";

type ConcentrationSaveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterName: string;
  concentration: TrackerConcentration;
  pendingCheck: PendingConcentrationCheck;
  onResolve: (result: "kept" | "lost" | "later") => void;
  allowLater?: boolean;
  requireResolution?: boolean;
};

export function ConcentrationSaveDialog({
  open,
  onOpenChange,
  characterName,
  concentration,
  pendingCheck,
  onResolve,
  allowLater = true,
  requireResolution = false,
}: ConcentrationSaveDialogProps) {
  const t = useTranslations("initTracker.tracker.concentration");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && requireResolution) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md rounded-[15px] bg-card"
        showCloseButton={!requireResolution}
        onInteractOutside={requireResolution ? (event) => event.preventDefault() : undefined}
        onEscapeKeyDown={requireResolution ? (event) => event.preventDefault() : undefined}>
        <DialogHeader>
          <DialogTitle>{t("saveDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("saveDialogDescription", {
              name: characterName,
              spell: concentration.spellName,
              damage: pendingCheck.damageAmount,
              dc: pendingCheck.dc,
            })}
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-white/70">{t("saveDialogReminder", { dc: pendingCheck.dc })}</p>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
          <Button
            type="button"
            className="h-10 w-full rounded-[15px]"
            onClick={() => onResolve("kept")}>
            {t("kept")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-[15px] border-red/40 text-red hover:bg-red/15 hover:text-red"
            onClick={() => onResolve("lost")}>
            {t("lost")}
          </Button>
          {allowLater ? (
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full rounded-[15px] text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => onResolve("later")}>
              {t("later")}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
