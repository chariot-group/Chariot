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
import { useCampaigns } from "@/hooks/useCampaigns";
import { showToast } from "@/lib/toast";
import { Campaign } from "@/types/campaign";

interface EditCampaignDialogProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void | Promise<void>;
}

export function EditCampaignDialog({ campaign, open, onOpenChange, onUpdated }: EditCampaignDialogProps) {
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const { updateCampaign } = useCampaigns({ autoFetch: false });
  const [label, setLabel] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (open && campaign) {
      setLabel(campaign.label);
    }
  }, [campaign, open]);

  const handleSave = async () => {
    if (!campaign || isSaving || !label.trim()) return;

    setIsSaving(true);
    try {
      await updateCampaign(campaign._id, { label: label.trim() });
      await onUpdated?.();
      showToast(t("campaignUpdatedSuccess", { name: label.trim() }), "success");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating campaign:", error);
      showToast(t("campaignUpdateFailed"), "error");
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
          <DialogTitle>{t("editCampaignDialogTitle")}</DialogTitle>
          <DialogDescription>{t("editCampaignDialogDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-campaign-name">{t("campaignName")}</Label>
            <Input
              id="edit-campaign-name"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={t("campaignNamePlaceholder")}
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
