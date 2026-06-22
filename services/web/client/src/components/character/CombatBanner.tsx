"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Dices, Heart, ScrollText, Shield, Swords, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useStore } from "react-redux";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  canUndoBattleTurn,
  characterName,
  filterRowsForPlayerView,
  getInitiativeTrackerRowStatus,
  sanitizeInitiativeTrackerRowForPlayer,
  sortInitiativeTrackerRows,
} from "@/components/initiativeTracker/utils";
import { CONDITION_META } from "@/components/initiativeTracker/conditionMeta";
import { formatRemainingConditionDuration } from "@/components/initiativeTracker/conditionDuration";
import { cn } from "@/lib/utils";
import { emitBattleStateUpdate } from "@/lib/sessionBattleSyncBridge";
import { useNewlyRevealedRows } from "@/hooks/useNewlyRevealedRows";
import { useStatusChangedRows } from "@/hooks/useStatusChangedRows";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store/index";
import { selectIsGmMode } from "@/store/slices/environmentSlice";
import {
  nextBattleTurn,
  previousBattleTurn,
  selectActiveTurnRowId,
  selectBattleStarted,
  selectBattleStateSnapshot,
  selectCurrentRound,
  selectInitiativeTrackerRows,
  selectSessionCode,
  selectTurnsWithActions,
  type InitiativeTrackerConditionEntry,
} from "@/store/slices/sessionSlice";

interface CombatBannerProps {
  /** ID du personnage actuellement consulté — sert à détecter si c'est son tour. */
  characterId?: string;
  footerActions?: React.ReactNode;
}

export function CombatBanner({ characterId, footerActions }: CombatBannerProps) {
  const t = useTranslations("initTracker.tracker");
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const router = useRouter();
  const locale = useLocale();

  const isGm = useAppSelector(selectIsGmMode);
  const battleStarted = useAppSelector(selectBattleStarted);
  const allRows = useAppSelector(selectInitiativeTrackerRows);
  const activeTurnRowId = useAppSelector(selectActiveTurnRowId);
  const currentRound = useAppSelector(selectCurrentRound);
  const turnsWithActions = useAppSelector(selectTurnsWithActions);
  const sessionCode = useAppSelector(selectSessionCode);

  const [expandedRowId, setExpandedRowId] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const chipRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());

  const sortedRows = React.useMemo(() => {
    const rows = sortInitiativeTrackerRows(allRows);
    if (isGm) return rows;
    return filterRowsForPlayerView(rows).map(sanitizeInitiativeTrackerRowForPlayer);
  }, [allRows, isGm]);

  const canGoPrevious = React.useMemo(
    () => canUndoBattleTurn(sortedRows, currentRound, activeTurnRowId, turnsWithActions),
    [sortedRows, currentRound, activeTurnRowId, turnsWithActions],
  );

  const isInCombat = React.useMemo(
    () => !!characterId && sortedRows.some((row) => row.characterId === characterId),
    [characterId, sortedRows],
  );

  const isMyTurn = React.useMemo(() => {
    if (!characterId || !activeTurnRowId) return false;
    const activeRow = sortedRows.find((row) => row.id === activeTurnRowId);
    return activeRow?.characterId === characterId;
  }, [characterId, activeTurnRowId, sortedRows]);

  const activeDisplayName = React.useMemo(() => {
    if (!activeTurnRowId) return t("unknownCombatant");
    const activeRow = sortedRows.find((row) => row.id === activeTurnRowId);
    if (!activeRow) return t("unknownCombatant");
    if (isGm) {
      return characterName(activeRow.firstname, activeRow.lastname, activeRow.surname) || activeRow.playerDisplayName || t("unknownCombatant");
    }
    return activeRow.playerFieldVisibility.name
      ? (activeRow.playerDisplayName?.trim() || characterName(activeRow.firstname, activeRow.lastname, activeRow.surname) || t("unknownCombatant"))
      : t("unknownCombatant");
  }, [activeTurnRowId, sortedRows, isGm, t]);

  const expandedRow = React.useMemo(
    () => sortedRows.find((row) => row.id === expandedRowId) ?? null,
    [sortedRows, expandedRowId],
  );

  const newlyRevealedIds = useNewlyRevealedRows(isGm ? [] : sortedRows.map((r) => r.id));
  const statusChangedRows = useStatusChangedRows(sortedRows, isGm);

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

  // Auto-scroll le carrousel pour centrer le combattant actif
  React.useEffect(() => {
    if (!activeTurnRowId || !carouselRef.current) return;
    const chip = chipRefs.current.get(activeTurnRowId);
    if (!chip) return;
    const container = carouselRef.current;
    const scrollTarget = chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2;
    container.scrollTo({ left: scrollTarget, behavior: "smooth" });
  }, [activeTurnRowId]);

  // Fermer le panneau étendu au clic extérieur
  React.useEffect(() => {
    if (!expandedRowId) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpandedRowId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expandedRowId]);

  const broadcastAfterDispatch = React.useCallback(() => {
    const snapshot = selectBattleStateSnapshot(store.getState());
    if (snapshot.battleStarted || snapshot.battleInitialized) {
      emitBattleStateUpdate(snapshot);
    }
  }, [store]);

  const handlePrevious = React.useCallback(() => {
    dispatch(previousBattleTurn());
    broadcastAfterDispatch();
  }, [dispatch, broadcastAfterDispatch]);

  const handleNext = React.useCallback(() => {
    dispatch(nextBattleTurn());
    broadcastAfterDispatch();
  }, [dispatch, broadcastAfterDispatch]);

  const handleRowClick = React.useCallback((rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  }, []);

  const handleViewSheet = React.useCallback(
    (cId: string) => {
      const query = sessionCode ? `?sessionCode=${encodeURIComponent(sessionCode)}` : "";
      router.push(`/${locale}/characters/${encodeURIComponent(cId)}${query}`);
    },
    [router, locale, sessionCode],
  );

  const formatConditionDuration = React.useCallback(
    (entry: InitiativeTrackerConditionEntry): string | null => {
      if (entry.duration?.unit === "untilCombatEnd") {
        return t("conditionDurationUntilCombatEnd");
      }
      if (entry.remainingSeconds != null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return formatRemainingConditionDuration(entry.remainingSeconds, (unit, amount) => t(`conditionDurationUnits.${unit}` as any, { amount }));
      }
      return null;
    },
    [t],
  );

  if (!battleStarted || sortedRows.length === 0) {
    return footerActions ? (
      <div className="shrink-0 border-t border-white/10 px-4 sm:px-6 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
        <div className="flex w-full justify-end">{footerActions}</div>
      </div>
    ) : null;
  }

  const hasVisibleStats =
    isGm ||
    (expandedRow &&
      (expandedRow.playerFieldVisibility.hitPoints ||
        expandedRow.playerFieldVisibility.armorClass ||
        expandedRow.playerFieldVisibility.initiative ||
        (expandedRow.playerFieldVisibility.conditions && expandedRow.conditions.length > 0)));

  return (
    <div ref={containerRef} className="shrink-0 border-t border-white/10 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveAnnouncement}</div>

      {/* Actions d'édition — mobile : au-dessus de la zone combat, desktop : inline dans la nav */}
      {footerActions && (
        <div className="flex justify-end px-2 pt-1.5 sm:hidden">
          {footerActions}
        </div>
      )}

      {/* Séparateur mobile avec indicateur de manche intégré */}
      <div className={cn("flex items-center gap-2 px-2 sm:hidden", footerActions ? "pt-1" : "pt-1.5")}>
        <Swords className="size-3 shrink-0 text-white/20" aria-hidden="true" />
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] tabular-nums text-white/35">
          {t("roundIndicator", { round: currentRound })}
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Ligne de navigation combat */}
      <div className="flex min-w-0 items-center gap-1 px-2 py-1.5 sm:px-4">

        {/* Indicateur "votre tour" (joueur uniquement) */}
        {!isGm && isInCombat && (
          <div
            className={cn(
              "flex max-w-[8rem] shrink-0 items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold transition-colors",
              isMyTurn ? "text-purple" : "text-white/50",
            )}>
            <Swords className={cn("size-2.5 shrink-0", isMyTurn && "animate-pulse")} />
            <span className={cn("truncate", isMyTurn && "animate-pulse")}>
              {isMyTurn ? t("yourTurn") : t("notYourTurn", { name: activeDisplayName })}
            </span>
          </div>
        )}

        {/* Tour précédent (MJ uniquement) */}
        {isGm ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!canGoPrevious}
                  aria-label={t("previousTurn")}
                  onClick={handlePrevious}
                  className="h-7 w-7 rounded-full text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30">
                  <ChevronLeft className="size-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{t("previousTurn")}</TooltipContent>
          </Tooltip>
        ) : (
          <div className="w-7 shrink-0" />
        )}

        {/* Carrousel des combattants */}
        <div
          ref={carouselRef}
          className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20">
          {sortedRows.map((row) => {
            const isActive = row.id === activeTurnRowId;
            const isExpanded = row.id === expandedRowId;
            const isOwnCharacter = !isGm && !!characterId && row.characterId === characterId;
            const displayName = isGm
              ? (characterName(row.firstname, row.lastname, row.surname) || row.playerDisplayName || t("unknownCombatant"))
              : row.playerFieldVisibility.name
                ? (row.playerDisplayName?.trim() || characterName(row.firstname, row.lastname, row.surname) || t("unknownCombatant"))
                : t("unknownCombatant");

            const baseAriaLabel = isExpanded ? t("collapseStats", { name: displayName }) : t("expandStats", { name: displayName });
            const chipAriaLabel = isOwnCharacter ? `${baseAriaLabel} — ${t("ownCharacterLabel", { name: displayName })}` : baseAriaLabel;

            const isNewlyRevealed = !isGm && newlyRevealedIds.has(row.id);
            const statusAnimation = statusChangedRows.get(row.id);
            const lifeStatusVisible = isGm || row.playerFieldVisibility.lifeStatus;
            const rowStatus = lifeStatusVisible ? getInitiativeTrackerRowStatus(row) : "alive";
            const isDead = rowStatus === "dead";
            const isUnconscious = rowStatus === "unconscious";

            return (
              <button
                key={row.id}
                ref={(el) => {
                  if (el) chipRefs.current.set(row.id, el);
                  else chipRefs.current.delete(row.id);
                }}
                type="button"
                aria-label={chipAriaLabel}
                aria-expanded={isExpanded}
                onClick={() => handleRowClick(row.id)}
                className={cn(
                  "flex min-w-10 shrink-0 items-center gap-1.5 rounded px-1.5 py-1 transition-all",
                  "cursor-pointer hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
                  isActive ? "opacity-100" : "opacity-40",
                  isExpanded && "bg-white/5 opacity-100 ring-1 ring-white/15",
                  isNewlyRevealed && "opacity-100 rounded-[8px] bg-green/[0.08] shadow-[0_0_0_1.5px_rgba(154,226,1,0.65),0_0_10px_rgba(154,226,1,0.4)] animate-pulse",
                  !isNewlyRevealed && statusAnimation === "dead" && "opacity-100 rounded-[8px] shadow-[0_0_0_1.5px_rgba(255,45,45,0.65),0_0_10px_rgba(255,45,45,0.35)] animate-pulse",
                  !isNewlyRevealed && statusAnimation === "unconscious" && "opacity-100 rounded-[8px] shadow-[0_0_0_1.5px_rgba(255,196,0,0.65),0_0_10px_rgba(255,196,0,0.35)] animate-pulse",
                )}>
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors",
                    isActive
                      ? "bg-purple text-white ring-2 ring-purple/40 ring-offset-1 ring-offset-transparent"
                      : isDead
                        ? "bg-red/25 text-red ring-2 ring-red/40 ring-offset-1 ring-offset-transparent"
                        : isUnconscious
                          ? "bg-yellow/20 text-yellow ring-2 ring-yellow/40 ring-offset-1 ring-offset-transparent"
                          : isOwnCharacter
                            ? "bg-blue/15 text-blue ring-2 ring-blue/40 ring-offset-1 ring-offset-transparent"
                            : "bg-white/10 text-white/60",
                  )}>
                  <User className="size-3" />
                </div>
                <span
                  className={cn(
                    "max-w-[60px] truncate text-[10px] leading-tight",
                    isActive
                      ? "font-semibold text-white"
                      : isDead
                        ? "font-semibold text-red"
                        : isUnconscious
                          ? "font-semibold text-yellow"
                          : isOwnCharacter
                            ? "font-semibold text-blue"
                            : "text-white/60",
                  )}>
                  {displayName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tour suivant (+ indicateur de manche sur sm+) */}
        <div className="flex shrink-0 items-center gap-0.5">
          <span className="hidden text-[10px] tabular-nums text-white/50 sm:inline">
            {t("roundIndicator", { round: currentRound })}
          </span>
          {isGm ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!battleStarted}
                  aria-label={t("nextTurn")}
                  onClick={handleNext}
                  className="h-7 w-7 rounded-full text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30">
                  <ChevronRight className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("nextTurn")}</TooltipContent>
            </Tooltip>
          ) : (
            <div className="w-7 shrink-0" />
          )}
        </div>

        {/* Actions d'édition — inline sur sm+ avec séparateur visuel */}
        {footerActions && (
          <div className="ml-1 hidden shrink-0 border-l border-white/10 pl-2 sm:block">
            {footerActions}
          </div>
        )}
      </div>

      {/* Panneau de stats étendu (au clic sur un combattant) */}
      {expandedRow && (
        <div className="mx-2 mb-1 rounded-[13px] bg-white/5 px-3 py-2 sm:mx-4">
          {hasVisibleStats ? (
            <div className="flex flex-col gap-2">

              {/* Stats numériques + bouton voir la fiche sur la même ligne */}
              <div className="flex min-w-0 items-center gap-x-4 gap-y-1.5 flex-wrap">
                {(isGm || expandedRow.playerFieldVisibility.hitPoints) && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Heart className="size-3 shrink-0 text-red-400" aria-hidden="true" />
                    <span className="font-semibold tabular-nums text-white">
                      {expandedRow.hitPoints}
                      {expandedRow.maxHitPoints > 0 && `/${expandedRow.maxHitPoints}`}
                    </span>
                    {expandedRow.tempHitPoints > 0 && (
                      <span className="text-[10px] text-green-400">+{expandedRow.tempHitPoints}</span>
                    )}
                  </div>
                )}

                {(isGm || expandedRow.playerFieldVisibility.armorClass) && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Shield className="size-3 shrink-0 text-blue-300" aria-hidden="true" />
                    <span className="font-semibold tabular-nums text-white">{expandedRow.armorClass}</span>
                  </div>
                )}

                {(isGm || expandedRow.playerFieldVisibility.initiative) && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Dices className="size-3 shrink-0 text-yellow-300" aria-hidden="true" />
                    <span className="font-semibold tabular-nums text-white">{expandedRow.initiative}</span>
                  </div>
                )}

                {/* Bouton voir la fiche (MJ uniquement) — aligné à droite sur la même ligne */}
                {isGm && (
                  <button
                    type="button"
                    aria-label={t("viewSheet")}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleViewSheet(expandedRow.characterId);
                    }}
                    className="ml-auto flex cursor-pointer shrink-0 items-center gap-1.5 rounded-[13px] bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/70 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    <ScrollText className="size-3.5 shrink-0" aria-hidden="true" />
                    {t("viewSheet")}
                  </button>
                )}
              </div>

              {/* Badges de conditions */}
              {(isGm || expandedRow.playerFieldVisibility.conditions) && expandedRow.conditions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {expandedRow.conditions.map((entry) => {
                    const meta = CONDITION_META[entry.condition];
                    if (!meta) return null;
                    const { Icon, badgeClassName } = meta;
                    const duration = formatConditionDuration(entry);
                    return (
                      <span
                        key={entry.condition}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none",
                          badgeClassName,
                        )}>
                        <Icon className="size-2.5 shrink-0" aria-hidden="true" />
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <span>{t(`conditions.${entry.condition}` as any)}</span>
                        {duration && (
                          <span className="ml-0.5 opacity-70">{duration}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-[11px] text-white/30">{t("noVisibleStats")}</p>
          )}
        </div>
      )}
    </div>
  );
}
