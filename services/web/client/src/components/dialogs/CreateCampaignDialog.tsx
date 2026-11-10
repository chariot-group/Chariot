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
import { useCampaigns } from "@/hooks/useCampaigns";
import { showToast } from "@/lib/toast";
import { TOAST_EMBEDDED_NAME_MAX_LENGTH, truncateForSidebarMenuLabel } from "@/lib/truncateForSidebarMenuLabel";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { setSelectedCampaign } from "@/store/slices/campaignContextSlice";
import { setContextMode } from "@/store/slices/environmentSlice";

interface CreateCampaignDialogProps {
  /** The element that opens the dialog (e.g. a Button). */
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: (campaignId: string) => void;
}

export function CreateCampaignDialog({
  children,
  open: controlledOpen,
  onOpenChange,
  onCreated,
}: CreateCampaignDialogProps) {
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const dispatch = useAppDispatch();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const [campaignName, setCampaignName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [labelServerError, setLabelServerError] = useState(false);
  const { createCampaign } = useCampaigns({ autoFetch: false });

  const handleCreate = async () => {
    if (!campaignName.trim()) {
      showToast(tCommon("errors.campaignNameRequired"), "error");
      return;
    }
    if (!isNameLabelValid(campaignName)) return;

    setIsCreating(true);
    try {
      const newCampaign = await createCampaign({
        label: campaignName.trim(),
        groups: {
          active: [],
          archived: [],
        },
      });

      dispatch(setSelectedCampaign(newCampaign._id));
      dispatch(setContextMode("gm"));

      showToast(
        t("campaignCreatedSuccess", {
          name: truncateForSidebarMenuLabel(newCampaign.label, TOAST_EMBEDDED_NAME_MAX_LENGTH),
        }),
        "success",
      );
      handleOpenChange(false);
      setCampaignName("");
      onCreated?.(newCampaign._id);
    } catch (error) {
      console.error("Error creating campaign:", error);
      if (isNameLabelValidationError(error)) {
        setLabelServerError(true);
      } else {
        showToast(tCommon("errors.campaignCreationFailed"), "error");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);

    if (!newOpen) {
      setCampaignName("");
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
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{t("createCampaignDialogTitle")}</DialogTitle>
          <DialogDescription>{t("createCampaignDialogDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <NameLabelField
            id="campaign-name"
            label={t("campaignName")}
            placeholder={t("campaignNamePlaceholder")}
            value={campaignName}
            onChange={(value) => {
              setCampaignName(value);
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
            disabled={isCreating || !isNameLabelValid(campaignName)}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
