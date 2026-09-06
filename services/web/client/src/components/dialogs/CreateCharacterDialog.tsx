"use client";

import * as React from "react";
import { useState } from "react";
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
import { User, Users, BookOpen, ArrowRight } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useCodexHealth } from "@/hooks/useCodexHealth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CREATE_CHARACTER_LIBRARY_STRIP,
  getManualCharacterButtonClasses,
} from "@/components/dialogs/createCharacterDialogStyles";
import { cn } from "@/lib/utils";

interface CreateCharacterDialogProps {
  /** The element that opens the dialog (e.g. a Button). */
  children: React.ReactNode;
  /** Campaign ID for the URL */
  campaignId: string;
  /** Group ID for the URL */
  groupId: string;
}

/**
 * Dialog for choosing how to create a character (manual player/NPC or community library import)
 */
export function CreateCharacterDialog({ children, campaignId, groupId }: CreateCharacterDialogProps) {
  const t = useTranslations("sidebar");
  const tMagic = useTranslations("characterDetail.magic");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const { isAvailable: isCodexAvailable } = useCodexHealth();
  const libraryUnavailableMessageId = "create-character-library-unavailable";

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
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {t("createCharacterDialogTitle")}
          </DialogTitle>
          <DialogDescription className="text-sm text-white/65 sm:text-base">
            {t("createCharacterDialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div
            className="grid grid-cols-2 gap-2"
            role="group"
            aria-label={t("createCharacterDialogDescription")}>
            <Button
              type="button"
              variant="outline"
              aria-label={t("createCharacterPlayerAriaLabel")}
              className={getManualCharacterButtonClasses("player")}
              onClick={() => handleSelectType("players")}>
              <User
                className="size-5 text-white/80 group-hover:text-white"
                aria-hidden="true"
              />
              {t("playerCharacter")}
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-label={t("createCharacterNpcAriaLabel")}
              className={getManualCharacterButtonClasses("npc")}
              onClick={() => handleSelectType("npcs")}>
              <Users
                className="size-5 text-white/80 group-hover:text-white"
                aria-hidden="true"
              />
              {t("npcCharacter")}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1 bg-white/15" />
            <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-white/45">
              {t("createCharacterDialogOrSeparator")}
            </span>
            <Separator className="flex-1 bg-white/15" />
          </div>

          <div className={cn(CREATE_CHARACTER_LIBRARY_STRIP, !isCodexAvailable && "opacity-60")}>
            <div className="flex min-w-0 items-start gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background/70 ring-1 ring-white/12"
                aria-hidden="true">
                <BookOpen className="size-5 text-yellow" />
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-semibold text-white">{t("createCharacterLibrarySectionTitle")}</p>
                <p className="text-xs text-white/60 sm:text-sm">{t("createCharacterLibrarySectionDescription")}</p>
                {!isCodexAvailable && (
                  <p
                    id={libraryUnavailableMessageId}
                    className="text-xs text-white/55">
                    {tMagic("codexUnavailable")}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={!isCodexAvailable}
              aria-label={t("createCharacterLibraryBrowseAriaLabel")}
              aria-describedby={!isCodexAvailable ? libraryUnavailableMessageId : undefined}
              onClick={() => handleSelectType("npcs-codex")}>
              {t("createCharacterLibraryBrowse")}
              <ArrowRight
                className="size-4"
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
