"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

interface SessionEndedDialogProps {
  reason: "closed" | "expired" | null;
  onConfirm: () => void;
}

export function SessionEndedDialog({ reason, onConfirm }: SessionEndedDialogProps) {
  const t = useTranslations("sessionPage.sessionEnded");

  return (
    <Dialog open={reason !== null}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {reason === "expired" ? t("description.expired") : t("description.closed")}
        </p>
        <DialogFooter>
          <Button onClick={onConfirm}>{t("confirm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
