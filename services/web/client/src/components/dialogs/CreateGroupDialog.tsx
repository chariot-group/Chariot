"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NameLabelField } from "@/components/dialogs/NameLabelField";
import { isNameLabelValid, isNameLabelValidationError } from "@/lib/nameLabel";
import { showToast } from "@/lib/toast";
import { TOAST_EMBEDDED_NAME_MAX_LENGTH, truncateForSidebarMenuLabel } from "@/lib/truncateForSidebarMenuLabel";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Group } from "@/types/campaign";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectSelectedCampaignId } from "@/store/slices/campaignContextSlice";
import { setOpenGroup } from "@/store/slices/groupSlice";

interface CreateGroupDialogProps {
  /** The element that opens the dialog (e.g. a Button). */
  children: React.ReactNode;
  onCreateGroup: (data: { label: string }) => Promise<Group>;
  onRefreshGroups: () => Promise<void>;
}

export function CreateGroupDialog({ children, onCreateGroup, onRefreshGroups }: CreateGroupDialogProps) {
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [labelServerError, setLabelServerError] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      showToast(tCommon("errors.groupNameRequired"), "error");
      return;
    }
    if (!isNameLabelValid(groupName)) return;

    setIsCreating(true);
    try {
      const newGroup = await onCreateGroup({
        label: groupName.trim(),
      });

      // Rafraîchir la liste des groupes (même pattern que pour les campagnes)
      await onRefreshGroups();

      dispatch(setOpenGroup(newGroup._id));

      if (selectedCampaignId && newGroup.characters?.length > 0) {
        const locale = pathname?.split("/")[1] || "fr";
        router.push(
          `/${locale}/campaigns/${selectedCampaignId}/groups/${newGroup._id}/characters/${newGroup.characters[0]._id}`,
        );
      }

      showToast(
        t("groupCreatedSuccess", { name: truncateForSidebarMenuLabel(newGroup.label, TOAST_EMBEDDED_NAME_MAX_LENGTH) }),
        "success",
      );
      setOpen(false);
      setGroupName("");
    } catch (error) {
      console.error("Error creating group:", error);
      if (isNameLabelValidationError(error)) {
        setLabelServerError(true);
      } else {
        showToast(tCommon("errors.groupCreationFailed"), "error");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setGroupName("");
      setLabelServerError(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isCreating) {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{t("createGroupDialogTitle")}</DialogTitle>
          <DialogDescription>{t("createGroupDialogDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <NameLabelField
            id="group-name"
            label={t("groupName")}
            placeholder={t("groupNamePlaceholder")}
            value={groupName}
            onChange={(value) => {
              setGroupName(value);
              setLabelServerError(false);
            }}
            onKeyDown={handleKeyDown}
            disabled={isCreating}
            autoFocus
            serverError={labelServerError}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="secondary"
              disabled={isCreating}>
              {tCommon("cancel")}
            </Button>
          </DialogClose>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !isNameLabelValid(groupName)}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
