"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MediaAvatar } from "@/components/media/MediaAvatar";
import {
  IdentityFactCells,
  TRUNCATE_ON_HOVER_DEVICES_CLASS,
} from "@/components/character/tabContents/general/shared/CharacterIdentityCard";
import { useNpcIdentityFacts } from "@/components/character/tabContents/general/shared/npcIdentityFacts";
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
 * Linked NPC card reusing the read-mode « Personnage » layout: facts in the column beside the avatar.
 * The whole card surface navigates; unlink sits in a
 * footer above the overlay.
 * @see FR-npc-player-link
 * @see FR-character-identity-card
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
  const identity = npcSheetHeaderIdentity(npc, unnamedFallback);
  const facts = useNpcIdentityFacts(npc);
  const headingId = `companion-${npc._id}-name`;

  return (
    <Card
      className="relative h-full min-w-0 w-full gap-2 overflow-hidden p-4 md:px-6"
      role="region"
      aria-labelledby={headingId}>
      <Link
        href={buildSessionCharacterHref(npc._id, sessionCode)}
        aria-label={t("openSheetAria", { name: identity.fullName })}
        className="absolute inset-0 z-0 rounded-[24px] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/50"
      />

      <div className="pointer-events-none relative z-10 flex h-full min-h-0 flex-col gap-2">
        <div className="flex flex-1 items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2
              id={headingId}
              title={identity.fullName}
              className={`text-lg font-bold text-primary-light sm:text-xl ${TRUNCATE_ON_HOVER_DEVICES_CLASS}`}>
              {identity.fullName}
            </h2>
            <div className="min-h-[1.375rem] sm:min-h-[1.5rem]">
              {identity.surname ? (
                <p
                  title={`« ${identity.surname} »`}
                  className={`text-sm italic text-muted-foreground sm:text-base ${TRUNCATE_ON_HOVER_DEVICES_CLASS}`}>
                  « {identity.surname} »
                </p>
              ) : null}
            </div>
            {identity.groupLabel ? (
              <p className={`text-xs text-muted-foreground sm:text-sm ${TRUNCATE_ON_HOVER_DEVICES_CLASS}`}>
                {identity.groupLabel}
              </p>
            ) : null}
            <div className="mt-0.5 min-w-0">
              <IdentityFactCells
                facts={facts}
                denseColumns
              />
            </div>
          </div>
          <div className="w-16 shrink-0 self-start aspect-[4/5] sm:w-20 md:w-24">
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
