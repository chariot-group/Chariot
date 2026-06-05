"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { User, Users, BookOpen } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useCodexHealth } from "@/hooks/useCodexHealth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CreateCharacterDialogProps {
  /** The element that opens the dialog (e.g. a Button). */
  children: React.ReactNode;
  /** Campaign ID for the URL */
  campaignId: string;
  /** Group ID for the URL */
  groupId: string;
}

/**
 * Dialog for choosing character type (Player or NPC) before creation
 */
export function CreateCharacterDialog({ children, campaignId, groupId }: CreateCharacterDialogProps) {
  const t = useTranslations("sidebar");
  const tMagic = useTranslations("characterDetail.magic");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const { isAvailable: isCodexAvailable } = useCodexHealth();

  const handleSelectType = (type: "players" | "npcs" | "npcs-codex") => {
    setOpen(false);
    setOpenMobile(false);
    router.push(`/campaigns/${campaignId}/groups/${groupId}/characters/new/${type}`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t("createCharacterDialogTitle")}</DialogTitle>
          <DialogDescription className="text-base">{t("createCharacterDialogDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6">
          {/* Player Character Option */}
          <Button
            variant="outline"
            onClick={() => handleSelectType("players")}
            className="flex flex-col items-center justify-center h-40 gap-3 rounded-[15px] border-2">
            <div className="p-3 rounded-full bg-card">
              <User
                className="w-12 h-12"
                aria-hidden="true"
              />
            </div>
            <span className="text-base font-semibold">{t("playerCharacter")}</span>
          </Button>

          {/* NPC Manual Option */}
          <Button
            variant="outline"
            onClick={() => handleSelectType("npcs")}
            className="flex flex-col items-center justify-center h-40 gap-3 rounded-[15px] border-2">
            <div className="p-3 rounded-full bg-card">
              <Users
                className="w-12 h-12"
                aria-hidden="true"
              />
            </div>
            <span className="text-base font-semibold">{t("npcCharacter")}</span>
          </Button>

          {/* NPC from Codex Option */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="w-full">
                <Button
                  variant="outline"
                  disabled={!isCodexAvailable}
                  onClick={() => handleSelectType("npcs-codex")}
                  className="w-full flex flex-col items-center justify-center h-40 gap-3 rounded-[15px] border-2 hover:bg-purple hover:text-white hover:border-purple hover:scale-105 transition-all duration-200 shadow-md hover:shadow-purple/50">
                  <div className="p-3 rounded-full bg-purple/10">
                    <BookOpen
                      className="w-12 h-12 text-purple"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-base font-semibold text-center">{t("npcCodexCharacter")}</span>
                </Button>
              </span>
            </TooltipTrigger>
            {!isCodexAvailable && (
              <TooltipContent>
                <p>{tMagic("codexUnavailable")}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </DialogContent>
    </Dialog>
  );
}
