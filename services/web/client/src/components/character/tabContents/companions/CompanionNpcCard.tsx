"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { MediaAvatar } from "@/components/media/MediaAvatar";
import { npcSheetHeaderIdentity } from "@/lib/npcPlayerLink";
import { buildSessionCharacterHref } from "@/lib/sessionInAppNavigation";
import type { NPC } from "@/types/character";

interface CompanionNpcCardProps {
  npc: NPC;
  unnamedFallback: string;
  isEditing: boolean;
  isPersisting: boolean;
  sessionCode?: string | null;
  onUnlink: (npc: NPC) => void;
}

/**
 * Linked NPC card mirroring the NPC sheet header identity.
 * The whole card surface navigates; unlink sits in a footer above the overlay.
 * @see FR-npc-player-link
 * @see FR-character-detail-view
 */
export function CompanionNpcCard({
  npc,
  unnamedFallback,
  isEditing,
  isPersisting,
  sessionCode,
  onUnlink,
}: CompanionNpcCardProps) {
  const t = useTranslations("characterDetail.companions");
  const tNpc = useTranslations("characterDetail.npc");
  const tCommon = useTranslations("common");
  const identity = npcSheetHeaderIdentity(npc, unnamedFallback);
  const openSheetLabel = t("openSheetAria", { name: identity.fullName });

  return (
    <Card className="relative min-w-0 h-full w-full gap-3 overflow-hidden p-4 md:px-6">
      <Link
        href={buildSessionCharacterHref(npc._id, sessionCode)}
        aria-label={openSheetLabel}
        className="absolute inset-0 z-0 rounded-[24px] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/50"
      />

      <div className="pointer-events-none relative z-10 grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2">
        <div className="col-start-1 row-start-1 min-w-0">
          <p className="w-full min-w-0 truncate text-left text-lg font-bold text-white sm:text-xl">
            {identity.fullName}
          </p>
          {identity.surname ? (
            <p className="mt-0.5 w-full min-w-0 truncate text-left text-sm italic text-gray-light">
              ({identity.surname})
            </p>
          ) : null}
        </div>

        <div className="col-start-2 row-start-1 row-span-2 w-16 shrink-0 aspect-[4/5] sm:w-20 md:w-24">
          <MediaAvatar
            scope="character"
            entityId={npc._id}
            storedValue={npc.avatar}
            sessionCode={sessionCode}
            size="sheet"
            fillContainer
            alt=""
          />
        </div>

        <div className="col-start-1 row-start-2 flex min-w-0 flex-col gap-1 text-left text-sm font-semibold text-white">
          <div className="min-w-0 truncate">
            <InfoTooltip
              className="pointer-events-auto"
              content={tCommon("challengeRatingTooltip")}
              side="bottom"
              moreInfoLabel={tCommon("challengeRatingTooltip")}>
              <abbr className="cursor-help no-underline">{tNpc("challengeRatingAbbr")}</abbr>
            </InfoTooltip>{" "}
            {identity.formattedChallengeRating} ({identity.experiencePoints} XP)
          </div>
          {identity.groupLabel ? (
            <p className="min-w-0 truncate text-xs font-normal text-gray-light">{identity.groupLabel}</p>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        <div className="relative z-20 mt-auto flex justify-end border-t border-white/10 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPersisting}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onUnlink(npc);
            }}
            aria-label={t("unlinkAria", { name: identity.fullName })}
            className="cursor-pointer shrink-0 text-white/80 hover:text-white">
            <Link2Off
              className="size-4"
              aria-hidden="true"
            />
            {t("unlink")}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
