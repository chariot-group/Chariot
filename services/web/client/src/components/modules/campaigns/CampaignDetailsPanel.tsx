"use client";

import DeleteValidation from "@/components/modals/DeleteValidation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ICampaign } from "@/models/campaigns/ICampaign";
import { PenBoxIcon, SaveIcon, TrashIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface CampaignDetailsPanelProps {
  campaign: ICampaign;
  setCampaign: (campaign: ICampaign) => void;
  onDelete: (campaign: ICampaign) => void;
  isUpdating: boolean;
  startUpdate: () => void;
  cancelUpdate: () => void;
  saveActions: () => void;
}
export default function CampaignDetailsPanel({
  campaign,
  setCampaign,
  onDelete,
  isUpdating,
  startUpdate,
  cancelUpdate,
  saveActions,
}: CampaignDetailsPanelProps) {
  const t = useTranslations("CampaignDetails");

  const [description, setDescription] = useState<string>(campaign.description);

  useEffect(() => {
    setDescription(campaign.description);
  }, [campaign]);

  useEffect(() => {
    setCampaign({
      ...campaign,
      description: description,
    });
  }, [description]);

  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);

  return (
    <div className="flex flex-col w-full gap-3 p-5">
      {deleteModalOpen && (
        <DeleteValidation
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title={t("modal.title")}
          message={t("modal.description")}
          confirmMessage={t("modal.confirm")}
          onConfirm={() => onDelete(campaign)}
        />
      )}
      <div className="w-full flex flex-col gap-2">
        <div className="w-full flex justify-between items-center">
          <Label
            htmlFor={"description"}
            className="text-foreground">
            {t("labels.description")}
          </Label>
          {!isUpdating && campaign && (
            <div className="flex flex-row gap-3 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    onClick={() => startUpdate()}>
                    <PenBoxIcon className="text-forground cursor-pointer" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("actions.update")}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TrashIcon
                    onClick={() => setDeleteModalOpen(true)}
                    className="text-primary cursor-pointer"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("actions.delete")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          {isUpdating && campaign && (
            <div className="flex flex-row gap-3 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => cancelUpdate()}>
                    <XIcon className="text-forground cursor-pointer" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("actions.cancel")}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    onClick={() => saveActions()}>
                    <SaveIcon className="text-forground cursor-pointer" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("actions.save")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
        <Textarea
          readOnly={!isUpdating}
          className="h-[10dvh] bg-card border-ring"
          placeholder={t("placeholders.description")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </div>
  );
}
