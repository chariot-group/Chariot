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
import { User, Users, BookOpen, type LucideIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useCodexHealth } from "@/hooks/useCodexHealth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CHARACTER_TYPE_OPTION_ICON,
  CHARACTER_TYPE_OPTION_ICON_WRAPPER,
  CHARACTER_TYPE_OPTION_LABEL,
  getCharacterTypeOptionClasses,
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

interface CharacterTypeOptionProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  disabledTooltip?: string;
}

function CharacterTypeOption({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  disabledTooltip,
}: CharacterTypeOptionProps) {
  const optionCard = (
    <span className={cn("group block w-full", disabled && "cursor-not-allowed")}>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={getCharacterTypeOptionClasses(disabled)}
        aria-disabled={disabled || undefined}>
        <span className={CHARACTER_TYPE_OPTION_ICON_WRAPPER}>
          <Icon
            className={CHARACTER_TYPE_OPTION_ICON}
            aria-hidden="true"
          />
        </span>
        <span className={CHARACTER_TYPE_OPTION_LABEL}>{label}</span>
      </button>
    </span>
  );

  if (disabled && disabledTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{optionCard}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-center">
          <p>{disabledTooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return optionCard;
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
      <DialogContent className="gap-6 sm:max-w-150">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-2xl font-bold tracking-tight text-white">{t("createCharacterDialogTitle")}</DialogTitle>
          <DialogDescription className="text-base text-white/65">
            {t("createCharacterDialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
          role="list"
          aria-label={t("createCharacterDialogDescription")}>
          <div role="listitem">
            <CharacterTypeOption
              icon={User}
              label={t("playerCharacter")}
              onClick={() => handleSelectType("players")}
            />
          </div>
          <div role="listitem">
            <CharacterTypeOption
              icon={Users}
              label={t("npcCharacter")}
              onClick={() => handleSelectType("npcs")}
            />
          </div>
          <div role="listitem">
            <CharacterTypeOption
              icon={BookOpen}
              label={t("npcCodexCharacter")}
              onClick={() => handleSelectType("npcs-codex")}
              disabled={!isCodexAvailable}
              disabledTooltip={!isCodexAvailable ? tMagic("codexUnavailable") : undefined}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
