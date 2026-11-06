"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function getLeaveSessionDescriptionKey(isMJ: boolean): "descriptionGm" | "descriptionPlayer" {
  return isMJ ? "descriptionGm" : "descriptionPlayer";
}

export function canConfirmLeaveSession(isLeaving: boolean): boolean {
  return !isLeaving;
}

interface ConfirmLeaveSessionDialogProps {
  isMJ: boolean;
  isLeaving: boolean;
  onConfirm: () => void;
  /** Trigger element; omit when the dialog is controlled (e.g. opened from a menu item). */
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConfirmLeaveSessionDialog({
  isMJ,
  isLeaving,
  onConfirm,
  children,
  open: controlledOpen,
  onOpenChange,
}: ConfirmLeaveSessionDialogProps) {
  const t = useTranslations("sessionPage.sessionLeave");
  const tCommon = useTranslations("common");
  const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t(getLeaveSessionDescriptionKey(isMJ))}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canConfirmLeaveSession(isLeaving)}
            onClick={() => {
              if (!canConfirmLeaveSession(isLeaving)) return;
              onConfirm();
              setOpen(false);
            }}>
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
