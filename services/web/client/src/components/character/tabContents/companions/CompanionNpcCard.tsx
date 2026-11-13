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
 * Linked NPC card reusing the read-mode « Personnage » card: name heading (tab violet) + nickname next to
 * the avatar, then the same NPC fact cells full width. The whole card surface navigates; unlink sits in a
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
      className="relative min-w-0 h-full w-full gap-3 overflow-hidden p-4 md:px-6"
      role="region"
      aria-labelledby={headingId}>
      <Link
        href={buildSessionCharacterHref(npc._id, sessionCode)}
        aria-label={t("openSheetAria", { name: identity.fullName })}
        className="absolute inset-0 z-0 rounded-[24px] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/50"
      />

      <div className="pointer-events-none relative z-10 flex flex-1 flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2
              id={headingId}
              title={identity.fullName}
              className={`text-lg font-bold text-primary-light sm:text-xl ${TRUNCATE_ON_HOVER_DEVICES_CLASS}`}>
              {identity.fullName}
            </h2>
            {identity.surname ? (
              <p
                title={`« ${identity.surname} »`}
                className={`text-sm italic text-muted-foreground sm:text-base ${TRUNCATE_ON_HOVER_DEVICES_CLASS}`}>
                « {identity.surname} »
              </p>
            ) : null}
            {identity.groupLabel ? (
              <p className={`text-xs text-muted-foreground sm:text-sm ${TRUNCATE_ON_HOVER_DEVICES_CLASS}`}>
                {identity.groupLabel}
              </p>
            ) : null}
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

        <IdentityFactCells facts={facts} />
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
