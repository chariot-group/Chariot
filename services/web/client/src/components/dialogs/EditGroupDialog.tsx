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
import { NameLabelField } from "@/components/dialogs/NameLabelField";
import { isNameLabelValid, isNameLabelValidationError } from "@/lib/nameLabel";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import GroupService from "@/services/GroupService";
import { showToast } from "@/lib/toast";
import { TOAST_EMBEDDED_NAME_MAX_LENGTH, truncateForSidebarMenuLabel } from "@/lib/truncateForSidebarMenuLabel";
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
  const [labelServerError, setLabelServerError] = React.useState(false);

  React.useEffect(() => {
    if (open && group) {
      setLabel(group.label);
      setLabelServerError(false);
    }
  }, [group, open]);

  const handleSave = async () => {
    if (!group || isSaving || !isNameLabelValid(label)) return;

    setIsSaving(true);
    try {
      await GroupService.updateGroup(group._id, { label: label.trim() });
      await onUpdated?.();
      showToast(
        t("groupUpdatedSuccess", { name: truncateForSidebarMenuLabel(label, TOAST_EMBEDDED_NAME_MAX_LENGTH) }),
        "success",
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating group:", error);
      if (isNameLabelValidationError(error)) {
        setLabelServerError(true);
      } else {
        showToast(t("groupUpdateFailed"), "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !isSaving && isNameLabelValid(label)) {
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
          <NameLabelField
            id="edit-group-name"
            label={t("groupName")}
            placeholder={t("groupNamePlaceholder")}
            value={label}
            onChange={(value) => {
              setLabel(value);
              setLabelServerError(false);
            }}
            disabled={isSaving}
            autoFocus
            serverError={labelServerError}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            disabled={isSaving || !isNameLabelValid(label)}
            onClick={() => void handleSave()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
