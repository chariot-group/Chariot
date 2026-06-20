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
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import GroupService from "@/services/GroupService";
import { showToast } from "@/lib/toast";
import { Group } from "@/types/campaign";

interface EditGroupDialogProps {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void | Promise<void>;
}

export function EditGroupDialog({ group, open, onOpenChange, onUpdated }: EditGroupDialogProps) {
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const [label, setLabel] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (open && group) {
      setLabel(group.label);
    }
  }, [group, open]);

  const handleSave = async () => {
    if (!group || isSaving || !label.trim()) return;

    setIsSaving(true);
    try {
      await GroupService.updateGroup(group._id, { label: label.trim() });
      await onUpdated?.();
      showToast(t("groupUpdatedSuccess", { name: label.trim() }), "success");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating group:", error);
      showToast(t("groupUpdateFailed"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !isSaving && label.trim()) {
      event.preventDefault();
      void handleSave();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSaving) onOpenChange(false);
      }}>
      <DialogContent
        className="sm:max-w-106.25"
        onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{t("editGroupDialogTitle")}</DialogTitle>
          <DialogDescription>{t("editGroupDialogDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-group-name">{t("groupName")}</Label>
            <Input
              id="edit-group-name"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={t("groupNamePlaceholder")}
              disabled={isSaving}
              autoFocus
              className="rounded-[15px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            disabled={isSaving || !label.trim()}
            onClick={() => void handleSave()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
