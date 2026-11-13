"use client";

import { useState } from "react";
import { Book } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCodexHealth } from "@/hooks/useCodexHealth";
import { LazySessionCommunityLibraryDialog } from "@/components/lazy/lazyDialogs";
import { shouldShowSessionCommunityLibraryButton } from "@/lib/sessionCommunityLibrary";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUserParticipant, selectIsSessionLaunched } from "@/store/slices/sessionSlice";
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
  const isSessionLaunched = useAppSelector(selectIsSessionLaunched);
  const user = useUser();
  const currentParticipant = useAppSelector((state) =>
    selectCurrentUserParticipant(state, user.user?.keycloakId || ""),
  );
  const isGameMaster = currentParticipant?.status === "gameMaster";

  if (!shouldShowSessionCommunityLibraryButton(isSessionLaunched, isGameMaster)) {
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
            onPointerEnter={LazySessionCommunityLibraryDialog.preload}
            onFocus={LazySessionCommunityLibraryDialog.preload}
            aria-haspopup="dialog"
            aria-expanded={open}
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

      <LazySessionCommunityLibraryDialog
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
