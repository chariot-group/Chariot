"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ConfirmCancelSessionDialogProps {
  onConfirm: () => void;
  children: React.ReactNode;
}

export function ConfirmCancelSessionDialog({ onConfirm, children }: ConfirmCancelSessionDialogProps) {
  const t = useTranslations("sessionPage.sessionCancel");
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <DialogFooter>
          <Button
            onClick={() => {
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
