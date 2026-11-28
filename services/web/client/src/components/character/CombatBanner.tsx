"use client";

import React from "react";
import { Swords } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  characterName,
  filterRowsForPlayerView,
  getInitiativeTrackerRowStatus,
  sanitizeInitiativeTrackerRowForPlayer,
  sortInitiativeTrackerRows,
  truncateTrackerLabel,
} from "@/components/initiativeTracker/utils";
import { cn } from "@/lib/utils";
import { MediaAvatar } from "@/components/media/MediaAvatar";
import { useMediaAvatarBatch } from "@/hooks/useMediaAvatar";
import { useNewlyRevealedRows } from "@/hooks/useNewlyRevealedRows";
import { useStatusChangedRows } from "@/hooks/useStatusChangedRows";
import { useAppSelector } from "@/store/hooks";
import { Link } from "@/i18n/navigation";
import { buildSessionCharacterHref } from "@/lib/sessionInAppNavigation";
import { selectIsGmMode } from "@/store/slices/environmentSlice";
import {
  selectActiveTurnRowId,
  selectBattleStarted,
  selectInitiativeTrackerRows,
  selectSessionCode,
} from "@/store/slices/sessionSlice";

/** FR-session-combat-navigation — horizontal padding shared by every zone of the sheet footer. */
const FOOTER_PADDING_X_CLASS = "px-4 sm:px-6 md:px-8";
/**
 * FR-session-combat-navigation — the footer is remounted on every sheet navigation (chip click, loading
 * skeleton): its strip position and the last turn it followed live here so it never moves by itself.
 * It scrolls only when the active turn actually changes.
 */
const stripMemory: { scrollLeft: number; activeTurnRowId: string | null } = { scrollLeft: 0, activeTurnRowId: null };

/** Test helper: forget the strip position and followed turn. */
export function resetCombatFooterStripMemory() {
  stripMemory.scrollLeft = 0;
  stripMemory.activeTurnRowId = null;
}

/** Scroll offset that centers `chip` in `container` (clamped by the browser). */
export function getCenteredChipScrollLeft(chip: { offsetLeft: number; offsetWidth: number }, containerWidth: number) {
  return Math.max(0, chip.offsetLeft - containerWidth / 2 + chip.offsetWidth / 2);
}

/** FR-session-combat-navigation — max visible characters of a footer chip name (then `…`). */
export const COMBAT_FOOTER_NAME_MAX_CHARS = 10;
const FOOTER_SAFE_AREA_CLASS = "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]";

interface CombatBannerProps {
  /** ID du personnage actuellement consulté — sert à détecter si c'est son tour. */
  characterId?: string;
  footerActions?: React.ReactNode;
}

export function CombatBanner({ characterId, footerActions }: CombatBannerProps) {
  const t = useTranslations("initTracker.tracker");

  const isGm = useAppSelector(selectIsGmMode);
  const battleStarted = useAppSelector(selectBattleStarted);
  const allRows = useAppSelector(selectInitiativeTrackerRows);
  const activeTurnRowId = useAppSelector(selectActiveTurnRowId);
  const sessionCode = useAppSelector(selectSessionCode);

  const carouselRef = React.useRef<HTMLDivElement>(null);
  const chipRefs = React.useRef<Map<string, HTMLElement>>(new Map());

  const sortedRows = React.useMemo(() => {
    const rows = sortInitiativeTrackerRows(allRows);
    if (isGm) return rows;
    return filterRowsForPlayerView(rows).map(sanitizeInitiativeTrackerRowForPlayer);
  }, [allRows, isGm]);

  const isInCombat = React.useMemo(
    () => !!characterId && sortedRows.some((row) => row.characterId === characterId),
    [characterId, sortedRows],
  );

  const isMyTurn = React.useMemo(() => {
    if (!characterId || !activeTurnRowId) return false;
    const activeRow = sortedRows.find((row) => row.id === activeTurnRowId);
    return activeRow?.characterId === characterId;
  }, [characterId, activeTurnRowId, sortedRows]);

  const newlyRevealedIds = useNewlyRevealedRows(isGm ? [] : sortedRows.map((r) => r.id));
  const statusChangedRows = useStatusChangedRows(sortedRows, isGm);

  const avatarBatchItems = React.useMemo(
    () =>
      sortedRows.map((row) => ({
        scope: "character" as const,
        entityId: row.characterId,
        storedValue: row.avatar,
        size: "xs" as const,
      })),
    [sortedRows],
  );

  const { getUrl: getAvatarUrl } = useMediaAvatarBatch(
    avatarBatchItems,
    sessionCode,
    sortedRows.length > 0,
  );

  const [liveAnnouncement, setLiveAnnouncement] = React.useState("");
  const announcedRef = React.useRef(new Set<string>());
  React.useEffect(() => {
    if (isGm || newlyRevealedIds.size === 0) return;
    for (const id of announcedRef.current) {
      if (!newlyRevealedIds.has(id)) announcedRef.current.delete(id);
    }
    const toAnnounce = [...newlyRevealedIds].filter((id) => !announcedRef.current.has(id));
    if (toAnnounce.length === 0) return;
    toAnnounce.forEach((id) => announcedRef.current.add(id));
    const names = toAnnounce.map((id) => {
      const row = sortedRows.find((r) => r.id === id);
      if (!row) return "???";
      return row.playerFieldVisibility.name
        ? (row.playerDisplayName?.trim() || characterName(row.firstname, row.lastname, row.surname) || t("unknownCombatant"))
        : t("unknownCombatant");
    });
    setLiveAnnouncement(names.map((n) => `${n} — ${t("newlyCombatantRevealed")}`).join(". "));
  }, [newlyRevealedIds, isGm, sortedRows, t]);

  // Fin du combat : le prochain combat repart d'un bandeau neuf.
  React.useEffect(() => {
    if (!battleStarted) resetCombatFooterStripMemory();
  }, [battleStarted]);

  // Remontage (changement de fiche) : le bandeau reprend sa position, sans animation.
  React.useLayoutEffect(() => {
    if (carouselRef.current) carouselRef.current.scrollLeft = stripMemory.scrollLeft;
  }, []);

  // Centre le combattant actif uniquement quand le tour change (pas à chaque sélection de fiche).
  React.useEffect(() => {
    if (!activeTurnRowId || !carouselRef.current) return;
    if (stripMemory.activeTurnRowId === activeTurnRowId) return;
    const chip = chipRefs.current.get(activeTurnRowId);
    if (!chip) return;
    const firstFollow = stripMemory.activeTurnRowId === null;
    stripMemory.activeTurnRowId = activeTurnRowId;
    const container = carouselRef.current;
    const reduceMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = getCenteredChipScrollLeft(chip, container.offsetWidth);
    stripMemory.scrollLeft = left;
    container.scrollTo?.({ left, behavior: firstFollow || reduceMotion ? "auto" : "smooth" });
  }, [activeTurnRowId]);

  if (!battleStarted || sortedRows.length === 0) {
    return footerActions ? (
      <div className={cn("shrink-0 border-t border-frame pt-3", FOOTER_PADDING_X_CLASS, FOOTER_SAFE_AREA_CLASS)}>
        <div className="flex w-full justify-end">{footerActions}</div>
      </div>
    ) : null;
  }

  // FR-session-combat-navigation — the active combatant is highlighted in the strip, so only the player's
  // own turn gets a text status ("your turn"), never "turn of X".
  const turnStatusNode =
    !isGm && isInCombat && isMyTurn ? (
      <p
        data-slot="combat-footer-turn"
        className="flex min-w-0 shrink items-center gap-2 text-sm font-semibold text-primary-light">
        <Swords
          className="size-4 shrink-0 motion-safe:animate-pulse"
          aria-hidden="true"
        />
        <span className="truncate">{t("yourTurn")}</span>
      </p>
    ) : null;

  return (
    <div
      data-slot="combat-footer"
      className={cn("shrink-0 border-t border-frame pt-3", FOOTER_SAFE_AREA_CLASS)}>
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveAnnouncement}</div>

      {/* Mobile : « votre tour » au-dessus du bandeau */}
      {turnStatusNode ? <div className={cn("mb-2 flex sm:hidden", FOOTER_PADDING_X_CLASS)}>{turnStatusNode}</div> : null}

      {/* Barre : « votre tour » · bandeau des combattants · actions d'édition (une ligne sur sm+) */}
      <div className={cn("flex min-w-0 items-center gap-4", FOOTER_PADDING_X_CLASS)}>
        {turnStatusNode ? <div className="hidden max-w-[14rem] shrink-0 sm:flex">{turnStatusNode}</div> : null}

        {/* Bandeau des combattants, dans l'ordre d'initiative */}
        <div
          ref={carouselRef}
          onScroll={(event) => {
            stripMemory.scrollLeft = event.currentTarget.scrollLeft;
          }}
          role="group"
          aria-label={t("rowsRegion")}
          data-slot="combat-footer-strip"
          className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb">
          {sortedRows.map((row) => {
            const isActive = row.id === activeTurnRowId;
            const isOwnCharacter = !isGm && !!characterId && row.characterId === characterId;
            const isCurrentSheet = !!characterId && row.characterId === characterId;
            const ChipElement = (isGm || isOwnCharacter ? Link : "span") as React.ElementType;
            const displayName = isGm
              ? (characterName(row.firstname, row.lastname, row.surname) || row.playerDisplayName || t("unknownCombatant"))
              : row.playerFieldVisibility.name
                ? (row.playerDisplayName?.trim() || characterName(row.firstname, row.lastname, row.surname) || t("unknownCombatant"))
                : t("unknownCombatant");

            // FR-session-combat-navigation — a chip opens the combatant's sheet: any sheet for the GM,
            // only their own for a player (other sheets are not readable by players).
            const canOpenSheet = isGm || isOwnCharacter;
            const baseAriaLabel = canOpenSheet ? t("viewSheetFor", { name: displayName }) : displayName;
            const chipAriaLabel = [
              baseAriaLabel,
              isOwnCharacter ? t("ownCharacterLabel", { name: displayName }) : null,
              isActive ? t("activeTurn") : null,
            ]
              .filter(Boolean)
              .join(" — ");

            const isNewlyRevealed = !isGm && newlyRevealedIds.has(row.id);
            const statusAnimation = statusChangedRows.get(row.id);
            const lifeStatusVisible = isGm || row.playerFieldVisibility.lifeStatus;
            const rowStatus = lifeStatusVisible ? getInitiativeTrackerRowStatus(row) : "alive";
            const isDead = rowStatus === "dead";
            const isUnconscious = rowStatus === "unconscious";

            return (
              <ChipElement
                key={row.id}
                ref={(el: HTMLElement | null) => {
                  if (el) chipRefs.current.set(row.id, el);
                  else chipRefs.current.delete(row.id);
                }}
                href={canOpenSheet ? buildSessionCharacterHref(row.characterId, sessionCode) : undefined}
                data-active={isActive || undefined}
                title={displayName}
                aria-label={chipAriaLabel}
                aria-current={isCurrentSheet ? "page" : undefined}
                className={cn(
                  "flex min-w-10 shrink-0 items-center gap-2 rounded-[13px] py-1.5 pl-1.5 pr-3 transition-colors",
                  canOpenSheet &&
                    "cursor-pointer hover:bg-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  // The sheet on screen is the selected chip (box); the active turn is the sky-blue ring.
                  isCurrentSheet ? "bg-gray" : "bg-transparent",
                  isNewlyRevealed && "bg-green/[0.08] shadow-[0_0_0_1.5px_rgba(154,226,1,0.65),0_0_10px_rgba(154,226,1,0.4)] motion-safe:animate-pulse",
                  !isNewlyRevealed && statusAnimation === "dead" && "shadow-[0_0_0_1.5px_rgba(255,45,45,0.65),0_0_10px_rgba(255,45,45,0.35)] motion-safe:animate-pulse",
                  !isNewlyRevealed && statusAnimation === "unconscious" && "shadow-[0_0_0_1.5px_rgba(255,196,0,0.65),0_0_10px_rgba(255,196,0,0.35)] motion-safe:animate-pulse",
                )}>
                <MediaAvatar
                  scope="character"
                  entityId={row.characterId}
                  storedValue={row.avatar}
                  size="xs"
                  sessionCode={sessionCode}
                  alt={displayName}
                  avatarImageUrl={getAvatarUrl("character", row.characterId, "xs")}
                  className={cn(
                    "ring-2",
                    isActive
                      ? "ring-blue"
                      : isDead
                        ? "ring-red/60"
                        : isUnconscious
                          ? "ring-yellow/60"
                          : isOwnCharacter
                            ? "ring-primary-light/60"
                            : "ring-transparent",
                  )}
                />
                <span
                  className={cn(
                    "whitespace-nowrap text-xs leading-tight",
                    isActive || isCurrentSheet
                      ? "font-semibold text-white"
                      : isDead
                        ? "font-semibold text-red"
                        : isUnconscious
                          ? "font-semibold text-yellow"
                          : isOwnCharacter
                            ? "font-semibold text-primary-light"
                            : "text-muted-foreground",
                  )}>
                  {truncateTrackerLabel(displayName, COMBAT_FOOTER_NAME_MAX_CHARS)}
                </span>
              </ChipElement>
            );
          })}
        </div>

        {/* Actions d'édition, séparées du bandeau (sm+) */}
        {footerActions && (
          <div className="hidden shrink-0 border-l border-border pl-4 sm:block">
            {footerActions}
          </div>
        )}
      </div>

      {/* Mobile : actions sous le bandeau ; chaque bouton prend une part égale sur très petit écran,
          alignés à droite dès 480px (largeurs portées par les boutons de la fiche). */}
      {footerActions && (
        <div
          data-slot="combat-footer-mobile-actions"
          className={cn("mt-3 flex justify-end sm:hidden [&>div]:w-full", FOOTER_PADDING_X_CLASS)}>
          {footerActions}
        </div>
      )}
    </div>
  );
}
