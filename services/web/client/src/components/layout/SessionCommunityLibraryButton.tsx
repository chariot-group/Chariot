"use client";

import { useState } from "react";
import { Book } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCodexHealth } from "@/hooks/useCodexHealth";
import { SessionCommunityLibraryDialog } from "@/components/dialogs/SessionCommunityLibraryDialog";
import { shouldShowSessionCommunityLibraryButton } from "@/lib/sessionCommunityLibrary";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUserParticipant, selectIsInSession } from "@/store/slices/sessionSlice";
import { useUser } from "@/hooks/useUser";

/**
 * Header grimoire entry for in-session GM community library browse.
 * @see FR-session-gm-codex-library
 */
export default function SessionCommunityLibraryButton() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("header");
  const tMagic = useTranslations("characterDetail.magic");
  const { isAvailable: isCodexAvailable, isChecking } = useCodexHealth();
  const isInSession = useAppSelector(selectIsInSession);
  const user = useUser();
  const currentParticipant = useAppSelector((state) =>
    selectCurrentUserParticipant(state, user.user?.keycloakId || ""),
  );
  const isGameMaster = currentParticipant?.status === "gameMaster";

  if (!shouldShowSessionCommunityLibraryButton(isInSession, isGameMaster)) {
    return null;
  }

  const isDisabled = !isCodexAvailable || isChecking;
  const tooltipLabel = isCodexAvailable ? t("communityLibraryTooltip") : tMagic("codexUnavailable");

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => setOpen(true)}
            aria-label={t("communityLibraryAriaLabel")}
            className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:size-12">
            <Book
              className="size-5 sm:size-6"
              aria-hidden="true"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>{tooltipLabel}</TooltipContent>
      </Tooltip>

      <SessionCommunityLibraryDialog
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
