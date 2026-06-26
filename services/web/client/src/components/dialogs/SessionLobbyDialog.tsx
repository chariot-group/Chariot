"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
      <DialogContent
        className="flex h-[80dvh] max-w-5xl w-[calc(100vw-2rem)] flex-col overflow-hidden p-0"
        aria-describedby={undefined}>
        <DialogTitle className="sr-only">{t("title")}</DialogTitle>
        <div className="min-h-0 flex-1">
          <SessionLobbyContent
            code={code}
            idCampaign={campaignId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
