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
import { User, Bot, BookOpen, ArrowRight } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useCodexHealth } from "@/hooks/useCodexHealth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CREATE_CHARACTER_DIALOG_CONTENT,
  CREATE_CHARACTER_LIBRARY_SECTION,
  CREATE_CHARACTER_MANUAL_GROUP,
  CREATE_CHARACTER_NPC_BUTTON,
  CREATE_CHARACTER_PLAYER_BUTTON,
} from "@/components/dialogs/createCharacterDialogStyles";
import { cn } from "@/lib/utils";
import {
  buildCreateCharacterPath,
  type CampaignCreateContext,
  type CreateCharacterChoice,
} from "@/lib/codexCharacterCreate";

interface CreateCharacterDialogProps {
  /** The element that opens the dialog (e.g. a Button). */
  children: React.ReactNode;
  /** Campaign ID for the URL (GM group create). Omit in Player space. */
  campaignId?: string;
  /** Group ID for the URL (GM group create). Omit in Player space. */
  groupId?: string;
  /** Hide the Player choice (Companions « create linked »). */
  npcOnly?: boolean;
  /** Forwarded on NPC and Codex create routes (Player space). */
  linkedPlayerId?: string | null;
}

/**
 * Dialog for choosing how to create a character (manual player/NPC or community library import)
 * @see FR-player-space-codex-character-creation
 * @see FR-npc-player-link
 */
export function CreateCharacterDialog({
  children,
  campaignId,
  groupId,
  npcOnly = false,
  linkedPlayerId,
}: CreateCharacterDialogProps) {
  const t = useTranslations("sidebar");
  const tMagic = useTranslations("characterDetail.magic");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const { isAvailable: isCodexAvailable } = useCodexHealth();
  const libraryUnavailableMessageId = `${React.useId()}-create-character-library-unavailable`;
  const campaignContext: CampaignCreateContext | undefined =
    campaignId && groupId ? { campaignId, groupId } : undefined;

  const handleSelectType = (type: CreateCharacterChoice) => {
    setOpen(false);
    setOpenMobile(false);
    router.push(buildCreateCharacterPath(type, campaignContext, { linkedPlayerId }));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className={CREATE_CHARACTER_DIALOG_CONTENT}>
        <DialogHeader>
          <DialogTitle>{t("createCharacterDialogTitle")}</DialogTitle>
          <DialogDescription>{t("createCharacterDialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div
            className={cn(CREATE_CHARACTER_MANUAL_GROUP, npcOnly && "sm:grid-cols-1")}
            role="group"
            aria-label={t("createCharacterDialogDescription")}>
            {!npcOnly ? (
              <Button
                type="button"
                variant="primary"
                aria-label={t("createCharacterPlayerAriaLabel")}
                className={CREATE_CHARACTER_PLAYER_BUTTON}
                onClick={() => handleSelectType("players")}>
                <User aria-hidden="true" />
                {t("playerCharacter")}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              aria-label={t("createCharacterNpcAriaLabel")}
              className={CREATE_CHARACTER_NPC_BUTTON}
              onClick={() => handleSelectType("npcs")}>
              <Bot aria-hidden="true" />
              {t("npcCharacter")}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("createCharacterDialogOrSeparator")}
            </span>
            <Separator className="flex-1" />
          </div>

          <div className={cn(CREATE_CHARACTER_LIBRARY_SECTION, !isCodexAvailable && "opacity-60")}>
            <div className="min-w-0 space-y-1">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <BookOpen
                  className="size-5 shrink-0 text-yellow"
                  aria-hidden="true"
                />
                {t("createCharacterLibrarySectionTitle")}
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {t("createCharacterLibrarySectionDescription")}
              </p>
              {!isCodexAvailable && (
                <p
                  id={libraryUnavailableMessageId}
                  className="text-xs text-muted-foreground">
                  {tMagic("codexUnavailable")}
                </p>
              )}
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={!isCodexAvailable}
              aria-label={t("createCharacterLibraryBrowseAriaLabel")}
              aria-describedby={!isCodexAvailable ? libraryUnavailableMessageId : undefined}
              onClick={() => handleSelectType("codex")}>
              {t("createCharacterLibraryBrowse")}
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
