"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  closeSessionLobby,
  selectSessionCode,
  selectSessionCampaignId,
  selectSessionLobbyOpen,
} from "@/store/slices/sessionSlice";
import { SessionLobbyContent } from "@/components/dialogs/SessionLobbyContent";
import { useTranslations } from "next-intl";

export function SessionLobbyDialog() {
  const dispatch = useAppDispatch();
  const open = useAppSelector(selectSessionLobbyOpen);
  const code = useAppSelector(selectSessionCode);
  const campaignId = useAppSelector(selectSessionCampaignId);
  const t = useTranslations("sessionPage");

  if (!code || !campaignId) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dispatch(closeSessionLobby());
      }}>
      <DialogContent className="max-w-5xl w-[calc(100vw-2rem)] h-[80dvh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6 shrink-0">
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <SessionLobbyContent
            code={code}
            idCampaign={campaignId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
