"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NPC, Player } from "@/types/character";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/request";
import CodexService, {
  CodexMonsterItem,
  CodexPlayerItem,
  CodexPlayerTranslation,
  CodexSearchResultItem,
} from "@/services/CodexService";
import { Search, Loader2, BadgeCheck, FileBadge, ArrowLeft, Check, ChevronDown, Layers, ListMinus, ListPlus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import MonsterPreview from "@/components/character/MonsterPreview";
import CodexPreviewLanguageBar from "@/components/character/CodexPreviewLanguageBar";
import CodexIconLegend from "@/components/character/CodexIconLegend";
import CodexResultRow from "@/components/character/CodexResultRow";
import { formatChallengeRating } from "@/utils/challengeRating.utils";
import {
  codexDeclaredPreviewLangs,
  codexLocaleFlagEmoji,
  codexMonsterLangsVisibleInAllLanguagesSearch,
  codexMonsterTranslationLooksUsable,
  codexPlayerLangsVisibleInAllLanguagesSearch,
  codexPlayerTranslationLooksUsable,
} from "@/utils/codexLocale.utils";
import { GAME_SYSTEMS, getDefaultCodexGameSystemFilter, HAS_MULTIPLE_CODEX_GAME_SYSTEMS, type CodexGameSystem } from "@/constants/gameSystems";
import {
  createPortaledFilterOpenTracker,
  shouldPreventDialogDismissForPortaledFilter,
} from "@/lib/portaledFilterOpenTracker";
import {
  resolveCodexCreateSelection,
  parseCodexSelectionKey,
  resolvePreselectionLang,
  type CodexCreateSelection,
  type CodexPreselection,
} from "@/lib/codexCharacterCreate";
import { createStackedDialogGate } from "@/lib/stackedDialogGate";
import {
  characterDisplayName,
  isCharacterQueued as isCharacterQueuedInQueue,
  queuedCharacterKeys as buildQueuedCharacterKeys,
  toggleCharacterInQueue,
  type QueuedCharacterEntry,
} from "@/lib/codexCharacterQueue";
import React from "react";

type CodexEntityTypeFilter = "both" | "monsters" | "players";

interface MonsterCodexDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Kind-preserving create: monster → NPC, premade player → Player. */
  onCharacterSelected?: (selection: CodexCreateSelection) => void;
  /** Batch create (selection queue); skips per-character create forms. */
  onCharactersBatchSelected?: (selections: CodexCreateSelection[]) => void | Promise<void>;
  /** Disables import actions while a batch create is in progress. */
  batchCreateInProgress?: boolean;
  /** @deprecated Prefer onCharacterSelected. Called only for monster → NPC drafts. */
  onMonsterSelected?: (monster: Partial<NPC>) => void;
  /** Read-only browse: preview only, no NPC draft creation. */
  browseOnly?: boolean;
  /** Renders search UI without an outer Dialog (for embedding in a parent modal). */
  embedded?: boolean;
  /** Locks entity search to monsters or players and hides the entity-type filter. */
  lockedEntityTypeFilter?: "monsters" | "players";
  /** Entry to load and preview on open (share link). @see FR-codex-share-link-preselection */
  initialSelection?: CodexPreselection | null;
  /** Fired when the previewed entry changes (null when none), e.g. to mirror it in the URL. */
  onPreviewedEntryChange?: (entry: { kind: "player" | "monster"; id: string; lang: string | null } | null) => void;
  /** The link carried a Codex ID but its params were invalid: show the fallback error. */
  initialSelectionInvalid?: boolean;
  /** The parent navigates on close: skip the default `router.back()`. */
  skipBackOnClose?: boolean;
  /** Shared portaled filter tracker when embedded in a parent dialog. */
  sharedPortaledFilterOpenTracker?: ReturnType<typeof createPortaledFilterOpenTracker>;
}

function formatPlayerListDetail(
  translation: CodexPlayerTranslation,
  tClasses: (key: string) => string,
): string {
  const race = translation.profile?.race?.trim();
  if (race) return race;
  const classes = (translation.class ?? [])
    .map((entry) => {
      try {
        return tClasses(entry.name);
      } catch {
        return entry.name;
      }
    })
    .filter(Boolean);
  return classes.length > 0 ? classes.join(", ") : "—";
}

function PinnedLangFlag({
  lang,
  tDialog,
}: {
  lang?: string | null;
  tDialog: (key: string, values?: Record<string, unknown>) => string;
}) {
  if (!lang || !codexLocaleFlagEmoji(lang)) return null;

  return (
    <InfoTooltip
      content={tDialog(`languageFilter.${lang}`)}
      side="top"
      moreInfoLabel={tDialog(`languageFilter.${lang}`)}
      className="relative z-10 shrink-0">
      <span
        className="text-[1.35rem] leading-none select-none cursor-help"
        aria-label={tDialog(`languageFilter.${lang}`)}>
        {codexLocaleFlagEmoji(lang)}
      </span>
    </InfoTooltip>
  );
}

function MonsterResultItem({
  monsterItem,
  selectedLang,
  pinnedLang,
  isSelected,
  isQueued,
  onMonsterClick,
  tDialog,
}: {
  monsterItem: CodexMonsterItem;
  selectedLang: string | null;
  pinnedLang?: string | null;
  isSelected: boolean;
  isQueued?: boolean;
  onMonsterClick: (monster: CodexMonsterItem, lang: string) => unknown;
  tDialog: (key: string, values?: Record<string, unknown>) => string;
}) {
  const tCommon = useTranslations("common");

  const displayLang =
    pinnedLang ??
    (selectedLang && monsterItem.languages.includes(selectedLang) ? selectedLang : monsterItem.languages[0] || "en");

  const translation = monsterItem.translations[displayLang];
  if (!translation) return null;

  const hasBadges = monsterItem.tag === 1 || translation.srd;

  return (
    <CodexResultRow
      name={translation.firstname}
      isSelected={isSelected}
      isQueued={isQueued}
      onSelect={() => onMonsterClick(monsterItem, displayLang)}
      leading={
        <PinnedLangFlag
          lang={pinnedLang}
          tDialog={tDialog}
        />
      }
      meta={
        <>
          <InfoTooltip
            content={tCommon("challengeRatingTooltip")}
            side="top"
            moreInfoLabel={tCommon("challengeRatingTooltip")}
            className="relative z-10">
            <abbr className="no-underline cursor-help">{tDialog("crLabel")}</abbr>
          </InfoTooltip>
          {tDialog("monsterInfo", {
            cr: formatChallengeRating(translation.challenge?.challengeRating),
            type: translation.profile?.type,
          })}
        </>
      }
      badges={
        <>
          {isQueued ? (
            <Check
              className="size-5 text-primary-light"
              aria-label={tDialog("queuedInSelection")}
            />
          ) : null}
          {hasBadges ? (
            <>
              {monsterItem.tag === 1 && (
                <BadgeCheck
                  className="size-5 text-green-600"
                  aria-label={tDialog("validatedByChariot")}
                />
              )}
              {translation.srd && (
                <FileBadge
                  className="size-5"
                  aria-label={tDialog("srdContent")}
                />
              )}
            </>
          ) : null}
        </>
      }
    />
  );
}

function PlayerResultItem({
  playerItem,
  selectedLang,
  pinnedLang,
  isSelected,
  isQueued,
  onPlayerClick,
  tDialog,
  tClasses,
}: {
  playerItem: CodexPlayerItem;
  selectedLang: string | null;
  pinnedLang?: string | null;
  isSelected: boolean;
  isQueued?: boolean;
  onPlayerClick: (player: CodexPlayerItem, lang: string) => unknown;
  tDialog: (key: string, values?: Record<string, unknown>) => string;
  tClasses: (key: string) => string;
}) {
  const displayLang =
    pinnedLang ??
    (selectedLang && playerItem.languages.includes(selectedLang) ? selectedLang : playerItem.languages[0] || "en");

  const translation = playerItem.translations[displayLang];
  if (!translation) return null;

  return (
    <CodexResultRow
      name={translation.firstname}
      isSelected={isSelected}
      isQueued={isQueued}
      onSelect={() => onPlayerClick(playerItem, displayLang)}
      leading={
        <PinnedLangFlag
          lang={pinnedLang}
          tDialog={tDialog}
        />
      }
      meta={tDialog("playerInfo", {
        level: translation.progression?.level ?? 1,
        detail: formatPlayerListDetail(translation, tClasses),
      })}
      badges={
        <>
          {isQueued ? (
            <Check
              className="size-5 text-primary-light"
              aria-label={tDialog("queuedInSelection")}
            />
          ) : null}
          {playerItem.tag === 1 ? (
            <BadgeCheck
              className="size-5 text-green-600"
              aria-label={tDialog("validatedByChariot")}
            />
          ) : null}
        </>
      }
    />
  );
}

export default function MonsterCodexDialog({
  open,
  onOpenChange,
  onCharacterSelected,
  onCharactersBatchSelected,
  batchCreateInProgress = false,
  onMonsterSelected,
  browseOnly = false,
  embedded = false,
  skipBackOnClose = false,
  lockedEntityTypeFilter,
  initialSelection,
  initialSelectionInvalid = false,
  onPreviewedEntryChange,
  sharedPortaledFilterOpenTracker,
}: MonsterCodexDialogProps) {
  const router = useRouter();
  const userLocale = useLocale() as Locale;
  const tDialog = useTranslations("characterDetail.magic.monsterCodexDialog");
  const tMagic = useTranslations("characterDetail.magic");
  const tClasses = useTranslations("classes");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [selectedGameSystem, setSelectedGameSystem] = useState<CodexGameSystem | null>(
    getDefaultCodexGameSystemFilter,
  );
  const resolvedEntityTypeFilter = lockedEntityTypeFilter ?? "both";
  const [entityTypeFilter, setEntityTypeFilter] = useState<CodexEntityTypeFilter>(resolvedEntityTypeFilter);
  const [searchResults, setSearchResults] = useState<CodexSearchResultItem[]>([]);
  const [selectedMonster, setSelectedMonster] = useState<Partial<NPC> | null>(null);
  const [selectedCodexMonster, setSelectedCodexMonster] = useState<CodexMonsterItem | null>(null);
  const [selectedCodexPlayer, setSelectedCodexPlayer] = useState<CodexPlayerItem | null>(null);
  const [selectedEntryKind, setSelectedEntryKind] = useState<"monster" | "player" | null>(null);
  const [previewLangStack, setPreviewLangStack] = useState<string[]>([]);
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [previewLangResolving, setPreviewLangResolving] = useState(false);
  const [previewTranslationError, setPreviewTranslationError] = useState<string | null>(null);
  const [preselectionError, setPreselectionError] = useState(false);
  const [characterQueue, setCharacterQueue] = useState<QueuedCharacterEntry[]>([]);
  const [selectionDetailsOpen, setSelectionDetailsOpen] = useState(false);
  const isLoadingRef = useRef(false);
  const validateButtonRef = useRef<HTMLButtonElement>(null);
  const focusValidateOnSelectRef = useRef(false);
  const internalPortaledFilterOpenTrackerRef = useRef(createPortaledFilterOpenTracker());
  const portaledFilterOpenTracker =
    sharedPortaledFilterOpenTracker ?? internalPortaledFilterOpenTrackerRef.current;

  const handlePortaledFilterOpenChange = useCallback(
    (isOpen: boolean) => {
      portaledFilterOpenTracker.notifyOpenChange(isOpen);
    },
    [portaledFilterOpenTracker],
  );

  // Another dialog stacked on top (e.g. release notes) must close alone, not take this one with it.
  const stackedDialogGateRef = useRef<ReturnType<typeof createStackedDialogGate> | null>(null);
  useEffect(() => {
    const gate = createStackedDialogGate(document);
    stackedDialogGateRef.current = gate;
    window.addEventListener("keydown", gate.snapshot, true);
    window.addEventListener("pointerdown", gate.snapshot, true);
    return () => {
      window.removeEventListener("keydown", gate.snapshot, true);
      window.removeEventListener("pointerdown", gate.snapshot, true);
      stackedDialogGateRef.current = null;
    };
  }, []);

  const shouldPreventDialogOutsideDismiss = useCallback(
    (target: EventTarget | null) => {
      return (
        stackedDialogGateRef.current?.shouldIgnoreDismiss() === true ||
        shouldPreventDialogDismissForPortaledFilter(portaledFilterOpenTracker, target)
      );
    },
    [portaledFilterOpenTracker],
  );

  const compactLanguageLabel =
    selectedLang === null ? "🌍" : codexLocaleFlagEmoji(selectedLang) || selectedLang.toUpperCase();

  const ITEMS_PER_PAGE = 20;

  const searchCodex = useCallback(
    async (
      query: string,
      page: number = 1,
      append: boolean = false,
      apiLang?: string | null,
      apiGameSystem?: CodexGameSystem | null,
      apiEntityType?: CodexEntityTypeFilter,
    ) => {
      const lang = apiLang !== undefined ? apiLang : selectedLang;
      const gameSystem = apiGameSystem !== undefined ? apiGameSystem : selectedGameSystem;
      const entityFilter = apiEntityType !== undefined ? apiEntityType : entityTypeFilter;
      const includeMonsters = entityFilter !== "players";
      const includePlayers = entityFilter !== "monsters";

      if (isLoadingRef.current) {
        return;
      }

      isLoadingRef.current = true;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsSearching(true);
        setSearchResults([]);
      }
      setError(null);

      try {
        const newResultItems: CodexSearchResultItem[] = [];
        let monstersHasMore = false;
        let playersHasMore = false;

        if (includeMonsters) {
          const response = await CodexService.searchMonsters(
            query,
            lang,
            page,
            ITEMS_PER_PAGE,
            gameSystem ?? undefined,
          );
          const populated = await CodexService.populateMonstersList(response.data || []);
          newResultItems.push(...populated.map((item) => ({ kind: "monster" as const, item })));
          monstersHasMore = populated.length >= ITEMS_PER_PAGE;
        }

        if (includePlayers) {
          const response = await CodexService.searchPlayers(
            query,
            lang,
            page,
            ITEMS_PER_PAGE,
            gameSystem ?? undefined,
          );
          const populated = await CodexService.populatePlayersList(response.data || []);
          newResultItems.push(...populated.map((item) => ({ kind: "player" as const, item })));
          playersHasMore = populated.length >= ITEMS_PER_PAGE;
        }

        setSearchResults((prev) => {
          if (append) {
            const existingIds = new Set(prev.map((entry) => `${entry.kind}:${entry.item._id}`));
            const uniqueNewResults = newResultItems.filter(
              (entry) => !existingIds.has(`${entry.kind}:${entry.item._id}`),
            );
            return [...prev, ...uniqueNewResults];
          }
          return newResultItems;
        });

        setHasMore(
          (includeMonsters && monstersHasMore) || (includePlayers && playersHasMore),
        );
        setCurrentPage(page);
      } catch (err) {
        console.error("Error searching codex:", err);
        setError(tDialog("error"));
        if (!append) {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      }
    },
    [selectedLang, selectedGameSystem, entityTypeFilter, tDialog, ITEMS_PER_PAGE],
  );

  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      searchCodex(searchQuery, 1, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedLang, selectedGameSystem, entityTypeFilter, searchCodex]);

  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setSelectedLang(userLocale);
      setSelectedGameSystem(getDefaultCodexGameSystemFilter());
      setEntityTypeFilter(resolvedEntityTypeFilter);
      setSearchResults([]);
      setSelectedMonster(null);
      setSelectedCodexMonster(null);
      setSelectedCodexPlayer(null);
      setSelectedEntryKind(null);
      setPreviewLangStack([]);
      setSelectedItemKey(null);
      setShowMobileDetails(false);
      setPreviewLangResolving(false);
      setPreviewTranslationError(null);
      setError(null);
      setPreselectionError(initialSelectionInvalid);
      setCharacterQueue([]);
      setSelectionDetailsOpen(true);
      setCurrentPage(1);
      setHasMore(false);
      isLoadingRef.current = false;
      if (!sharedPortaledFilterOpenTracker) {
        portaledFilterOpenTracker.reset();
      }
      searchCodex("", 1, false, userLocale, getDefaultCodexGameSystemFilter(), resolvedEntityTypeFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadMore = () => {
    if (!isLoadingMore && !isLoadingRef.current && hasMore) {
      const nextPage = currentPage + 1;
      searchCodex(searchQuery, nextPage, true);
    }
  };

  const handleMonsterClick = async (
    codexMonsterItem: CodexMonsterItem,
    lang: string,
    options?: { fromPreviewLangBar?: boolean },
  ): Promise<boolean> => {
    const fromPreview = options?.fromPreviewLangBar ?? false;
    const prevKey = selectedItemKey;
    let currentLangForSameId: string | undefined;
    if (prevKey) {
      const colon = prevKey.indexOf(":");
      const prevKind = colon >= 0 ? prevKey.slice(0, colon) : "";
      const rest = colon >= 0 ? prevKey.slice(colon + 1) : prevKey;
      const secondColon = rest.indexOf(":");
      const prevId = secondColon >= 0 ? rest.slice(0, secondColon) : rest;
      const prevLang = secondColon >= 0 ? rest.slice(secondColon + 1) : undefined;
      if (prevKind === "monster" && prevId === codexMonsterItem._id && prevLang) {
        currentLangForSameId = prevLang;
      }
    }

    if (fromPreview) {
      if (currentLangForSameId && currentLangForSameId !== lang) {
        setPreviewLangStack((s) => [...s, currentLangForSameId]);
      }
    } else {
      setPreviewLangStack([]);
    }

    setPreviewTranslationError(null);

    let item = codexMonsterItem;
    const shouldHydrate = fromPreview || !codexMonsterTranslationLooksUsable(item.translations[lang]);

    if (shouldHydrate) {
      setPreviewLangResolving(true);
      try {
        const forLang = await CodexService.getMonsterById(item._id, lang);
        if (forLang) {
          item = CodexService.overlayMonsterTranslationsFromDetail(item, forLang, [lang]);
        }
        if (!codexMonsterTranslationLooksUsable(item.translations[lang])) {
          const unscoped = await CodexService.getMonsterById(item._id);
          if (unscoped) {
            item = CodexService.overlayMonsterTranslationsFromDetail(item, unscoped, [lang]);
            if (!codexMonsterTranslationLooksUsable(item.translations[lang])) {
              item = CodexService.mergeMonsterFillMissingTranslations(item, unscoped);
            }
          }
        }
        if (!codexMonsterTranslationLooksUsable(item.translations[lang])) {
          setPreviewTranslationError(tDialog("preview.loadTranslationError"));
          return false;
        }
        const populated = await CodexService.populateMonstersList([item]);
        item = populated[0];
        if (!codexMonsterTranslationLooksUsable(item.translations[lang])) {
          setPreviewTranslationError(tDialog("preview.loadTranslationError"));
          return false;
        }
      } finally {
        setPreviewLangResolving(false);
      }
    }

    try {
      const convertedMonster = CodexService.convertToChariotNPC(item, lang);
      setSelectedCodexMonster(item);
      setSelectedCodexPlayer(null);
      setSelectedEntryKind("monster");
      setSelectedMonster(convertedMonster);
      setSelectedItemKey(`monster:${item._id}:${lang}`);
      setShowMobileDetails(true);
      return true;
    } catch {
      setPreviewTranslationError(tDialog("preview.loadTranslationError"));
      return false;
    }
  };

  const handlePlayerClick = async (
    codexPlayerItem: CodexPlayerItem,
    lang: string,
    options?: { fromPreviewLangBar?: boolean },
  ): Promise<boolean> => {
    const fromPreview = options?.fromPreviewLangBar ?? false;
    const prevKey = selectedItemKey;
    let currentLangForSameId: string | undefined;
    if (prevKey) {
      const colon = prevKey.indexOf(":");
      const prevKind = colon >= 0 ? prevKey.slice(0, colon) : "";
      const rest = colon >= 0 ? prevKey.slice(colon + 1) : prevKey;
      const secondColon = rest.indexOf(":");
      const prevId = secondColon >= 0 ? rest.slice(0, secondColon) : rest;
      const prevLang = secondColon >= 0 ? rest.slice(secondColon + 1) : undefined;
      if (prevKind === "player" && prevId === codexPlayerItem._id && prevLang) {
        currentLangForSameId = prevLang;
      }
    }

    if (fromPreview) {
      if (currentLangForSameId && currentLangForSameId !== lang) {
        setPreviewLangStack((s) => [...s, currentLangForSameId]);
      }
    } else {
      setPreviewLangStack([]);
    }

    setPreviewTranslationError(null);

    let item = codexPlayerItem;
    const shouldHydrate = fromPreview || !codexPlayerTranslationLooksUsable(item.translations[lang]);

    if (shouldHydrate) {
      setPreviewLangResolving(true);
      try {
        const forLang = await CodexService.getPlayerById(item._id, lang);
        if (forLang) {
          item = CodexService.overlayPlayerTranslationsFromDetail(item, forLang, [lang]);
        }
        if (!codexPlayerTranslationLooksUsable(item.translations[lang])) {
          const unscoped = await CodexService.getPlayerById(item._id);
          if (unscoped) {
            item = CodexService.overlayPlayerTranslationsFromDetail(item, unscoped, [lang]);
            if (!codexPlayerTranslationLooksUsable(item.translations[lang])) {
              item = CodexService.mergePlayerFillMissingTranslations(item, unscoped);
            }
          }
        }
        if (!codexPlayerTranslationLooksUsable(item.translations[lang])) {
          setPreviewTranslationError(tDialog("preview.loadTranslationError"));
          return false;
        }
        const populated = await CodexService.populatePlayersList([item]);
        item = populated[0];
        if (!codexPlayerTranslationLooksUsable(item.translations[lang])) {
          setPreviewTranslationError(tDialog("preview.loadTranslationError"));
          return false;
        }
      } finally {
        setPreviewLangResolving(false);
      }
    }

    try {
      const convertedMonster = CodexService.convertCodexPlayerToChariotNPC(item, lang);
      setSelectedCodexPlayer(item);
      setSelectedCodexMonster(null);
      setSelectedEntryKind("player");
      setSelectedMonster(convertedMonster);
      setSelectedItemKey(`player:${item._id}:${lang}`);
      setShowMobileDetails(true);
      return true;
    } catch {
      setPreviewTranslationError(tDialog("preview.loadTranslationError"));
      return false;
    }
  };

  const handlePreviewLangUndo = () => {
    if (previewLangStack.length === 0) return;
    setPreviewTranslationError(null);
    const prevLang = previewLangStack[previewLangStack.length - 1];

    if (selectedEntryKind === "monster" && selectedCodexMonster) {
      const convertedMonster = CodexService.convertToChariotNPC(selectedCodexMonster, prevLang);
      setSelectedMonster(convertedMonster);
      setSelectedItemKey(`monster:${selectedCodexMonster._id}:${prevLang}`);
    } else if (selectedEntryKind === "player" && selectedCodexPlayer) {
      const convertedMonster = CodexService.convertCodexPlayerToChariotNPC(selectedCodexPlayer, prevLang);
      setSelectedMonster(convertedMonster);
      setSelectedItemKey(`player:${selectedCodexPlayer._id}:${prevLang}`);
    } else {
      return;
    }

    setPreviewLangStack((s) => s.slice(0, -1));
  };

  const preselectionKind = initialSelection?.kind;
  const preselectionId = initialSelection?.id;
  const preselectionLang = initialSelection?.lang ?? null;

  useEffect(() => {
    if (!open || !preselectionKind || !preselectionId) return;
    let cancelled = false;

    const applyPreselection = async () => {
      const fetchLang = preselectionLang ?? userLocale;
      const item =
        preselectionKind === "player"
          ? await CodexService.getPlayerById(preselectionId, fetchLang)
          : await CodexService.getMonsterById(preselectionId, fetchLang);
      if (cancelled) return;

      const lang = item
        ? resolvePreselectionLang({
            requested: preselectionLang,
            userLocale,
            available: item.languages ?? [],
          })
        : null;
      if (!item || !lang) {
        setPreselectionError(true);
        return;
      }

      setSelectedLang(lang);
      focusValidateOnSelectRef.current = true;
      const selected =
        preselectionKind === "player"
          ? await handlePlayerClick(item as CodexPlayerItem, lang)
          : await handleMonsterClick(item as CodexMonsterItem, lang);
      if (cancelled) return;
      if (!selected) {
        focusValidateOnSelectRef.current = false;
        setPreselectionError(true);
      }
    };

    void applyPreselection();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectionKind, preselectionId, preselectionLang]);

  const lastEmittedEntryKeyRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!onPreviewedEntryChange) return;
    // Skip the initial « nothing selected » so a deep link isn't reset before it loads.
    if (lastEmittedEntryKeyRef.current === undefined && selectedItemKey === null) {
      lastEmittedEntryKeyRef.current = null;
      return;
    }
    if (lastEmittedEntryKeyRef.current === selectedItemKey) return;
    lastEmittedEntryKeyRef.current = selectedItemKey;
    onPreviewedEntryChange(parseCodexSelectionKey(selectedItemKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemKey]);

  useEffect(() => {
    if (selectedItemKey && focusValidateOnSelectRef.current) {
      focusValidateOnSelectRef.current = false;
      validateButtonRef.current?.focus();
    }
  }, [selectedItemKey]);

  const buildCurrentSelection = useCallback((): CodexCreateSelection | null => {
    if (!selectedItemKey || !selectedEntryKind) return null;
    const previewLang = selectedItemKey.split(":").at(-1) ?? "en";

    let playerDraft: Partial<Player> | null = null;
    if (selectedEntryKind === "player" && selectedCodexPlayer) {
      try {
        playerDraft = CodexService.convertCodexPlayerToChariotPlayer(selectedCodexPlayer, previewLang);
      } catch {
        return null;
      }
    }

    return resolveCodexCreateSelection({
      entryKind: selectedEntryKind,
      npcDraft: selectedEntryKind === "monster" ? selectedMonster : null,
      playerDraft,
    });
  }, [selectedCodexPlayer, selectedEntryKind, selectedItemKey, selectedMonster]);

  const queuedCharacterKeysSet = useMemo(() => buildQueuedCharacterKeys(characterQueue), [characterQueue]);
  const isCurrentCharacterQueued = selectedItemKey ? isCharacterQueuedInQueue(characterQueue, selectedItemKey) : false;
  const isMultiSelectionMode = characterQueue.length > 0;
  const characterActionsDisabled = !selectedMonster || previewLangResolving || batchCreateInProgress;
  const canBatchImport = !browseOnly && Boolean(onCharactersBatchSelected);

  // Close the selection panel once the queue is emptied so it does not reopen on the next selection.
  useEffect(() => {
    if (!isMultiSelectionMode) setSelectionDetailsOpen(false);
  }, [isMultiSelectionMode]);

  const handleValidate = () => {
    if (characterQueue.length > 0) return;
    const selection = buildCurrentSelection();
    if (!selection) {
      setPreviewTranslationError(tDialog("preview.loadTranslationError"));
      return;
    }

    onCharacterSelected?.(selection);
    if (selection.kind === "npc") {
      onMonsterSelected?.(selection.draft);
    }
  };

  const handleToggleQueueSelection = () => {
    if (!selectedItemKey) return;
    const selection = buildCurrentSelection();
    if (!selection) return;
    setCharacterQueue((prev) => toggleCharacterInQueue(prev, selectedItemKey, selection));
  };

  const handleAddSelection = () => {
    if (characterQueue.length === 0 || !onCharactersBatchSelected) return;
    void onCharactersBatchSelected(characterQueue.map((entry) => entry.selection));
  };

  const handleRemoveFromQueue = useCallback((key: string) => {
    setCharacterQueue((prev) => prev.filter((entry) => entry.key !== key));
  }, []);

  const handleClose = () => {
    onOpenChange(false);
    if (!browseOnly && !embedded && !skipBackOnClose) {
      router.back();
    }
  };

  const selectedPreviewCodexItem = selectedCodexMonster ?? selectedCodexPlayer;

  const countVisibleResultRows = () => {
    let visibleCount = 0;
    for (const result of searchResults) {
      if (result.kind === "monster") {
        if (selectedLang && !result.item.languages.includes(selectedLang)) {
          continue;
        }
        if (selectedLang) {
          if (CodexService.getMonsterTranslation(result.item, selectedLang) !== null) {
            visibleCount += 1;
          }
        } else {
          visibleCount += codexMonsterLangsVisibleInAllLanguagesSearch(result.item, searchQuery).length;
        }
      } else {
        if (selectedLang && !result.item.languages.includes(selectedLang)) {
          continue;
        }
        if (selectedLang) {
          if (CodexService.getPlayerTranslation(result.item, selectedLang) !== null) {
            visibleCount += 1;
          }
        } else {
          visibleCount += codexPlayerLangsVisibleInAllLanguagesSearch(result.item, searchQuery).length;
        }
      }
    }
    return visibleCount;
  };

  const dialogBody = (
    <>
      {!embedded ? (
        <DialogHeader className="min-h-14 shrink-0 justify-center border-b border-frame py-3 pl-6 pr-12">
          <DialogTitle className="text-xl leading-tight sm:text-2xl sm:leading-none">{tDialog("title")}</DialogTitle>
        </DialogHeader>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div
            className={`flex min-h-0 w-full flex-col gap-3 p-4 lg:w-1/4 lg:border-r lg:border-frame ${showMobileDetails ? "hidden lg:flex" : "flex"}`}>
            <div className="flex w-full shrink-0 flex-col gap-3 overflow-visible">
              <CodexIconLegend showSelection={canBatchImport} />
              <div className="flex w-full min-w-0 items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={tDialog("searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
                <Select
                  value={selectedLang ?? "all"}
                  onOpenChange={handlePortaledFilterOpenChange}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setSelectedLang(null);
                    } else if (value === "fr" || value === "en" || value === "es") {
                      setSelectedLang(value);
                    }
                  }}>
                  <SelectTrigger
                    className="h-9 w-auto shrink-0 gap-1 px-2.5 focus-visible:ring-inset [&_svg]:hidden"
                    aria-label={tDialog("languageFilter.ariaLabel")}>
                    <span
                      className="text-lg leading-none select-none"
                      aria-hidden="true">
                      {compactLanguageLabel}
                    </span>
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    align="end"
                    side="bottom"
                    sideOffset={4}
                    className="min-w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="all">{tDialog("languageFilter.all")}</SelectItem>
                    <SelectItem value="fr">{tDialog("languageFilter.fr")}</SelectItem>
                    <SelectItem value="en">{tDialog("languageFilter.en")}</SelectItem>
                    <SelectItem value="es">{tDialog("languageFilter.es")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-full min-w-0 gap-2">
                {!lockedEntityTypeFilter ? (
                  <Select
                    value={entityTypeFilter}
                    onOpenChange={handlePortaledFilterOpenChange}
                    onValueChange={(value) => {
                      if (value === "both" || value === "monsters" || value === "players") {
                        setEntityTypeFilter(value);
                      }
                    }}>
                    <SelectTrigger
                      className="min-w-0 flex-1 focus-visible:ring-inset"
                      aria-label={tDialog("entityTypeFilter.ariaLabel")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">{tDialog("entityTypeFilter.both")}</SelectItem>
                      <SelectItem value="monsters">{tDialog("entityTypeFilter.monsters")}</SelectItem>
                      <SelectItem value="players">{tDialog("entityTypeFilter.players")}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
                <Select
                  value={selectedGameSystem ?? "all"}
                  disabled={!HAS_MULTIPLE_CODEX_GAME_SYSTEMS}
                  onOpenChange={handlePortaledFilterOpenChange}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setSelectedGameSystem(null);
                    } else if (GAME_SYSTEMS.includes(value as CodexGameSystem)) {
                      setSelectedGameSystem(value as CodexGameSystem);
                    }
                  }}>
                  <SelectTrigger
                    disabled={!HAS_MULTIPLE_CODEX_GAME_SYSTEMS}
                    className="min-w-0 flex-1 focus-visible:ring-inset"
                    aria-label={tDialog("gameSystemFilter.ariaLabel")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HAS_MULTIPLE_CODEX_GAME_SYSTEMS ? (
                      <SelectItem value="all">{tDialog("gameSystemFilter.all")}</SelectItem>
                    ) : null}
                    {GAME_SYSTEMS.map((gameSystem) => (
                      <SelectItem
                        key={gameSystem}
                        value={gameSystem}>
                        {tDialog(`gameSystemFilter.${gameSystem}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {preselectionError ? (
              <p
                role="alert"
                className="shrink-0 rounded-md border border-red-500/60 px-3 py-2 text-sm text-red-500">
                {tDialog("preselectionError")}
              </p>
            ) : null}

            <div className="scrollbar-none flex-1 overflow-y-auto scroll-smooth">
              {isSearching ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">{tDialog("searching")}</span>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-sm text-red-500">{error}</div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {searchQuery ? tDialog("noResults") : tDialog("searchPlaceholder")}
                </div>
              ) : (
                (() => {
                  const visibleCount = countVisibleResultRows();

                  if (visibleCount === 0) {
                    return <div className="text-center py-8 text-sm text-muted-foreground">{tDialog("noResults")}</div>;
                  }

                  return (
                    <React.Fragment>
                      <div className="flex flex-col gap-1.5">
                        {searchResults.flatMap((result) => {
                          if (result.kind === "monster") {
                            const monsterItem = result.item;
                            if (selectedLang && !monsterItem.languages.includes(selectedLang)) {
                              return [];
                            }

                            if (selectedLang) {
                              return [
                                <MonsterResultItem
                                  key={`monster-${monsterItem._id}-${selectedLang}`}
                                  monsterItem={monsterItem}
                                  selectedLang={selectedLang}
                                  isSelected={selectedItemKey === `monster:${monsterItem._id}:${selectedLang}`}
                                  isQueued={queuedCharacterKeysSet.has(`monster:${monsterItem._id}:${selectedLang}`)}
                                  onMonsterClick={handleMonsterClick}
                                  tDialog={tDialog as (key: string, values?: Record<string, unknown>) => string}
                                />,
                              ];
                            }

                            return codexMonsterLangsVisibleInAllLanguagesSearch(monsterItem, searchQuery).map(
                              (lang: string) => (
                                <MonsterResultItem
                                  key={`monster-${monsterItem._id}-${lang}`}
                                  monsterItem={monsterItem}
                                  selectedLang={selectedLang}
                                  pinnedLang={lang}
                                  isSelected={selectedItemKey === `monster:${monsterItem._id}:${lang}`}
                                  isQueued={queuedCharacterKeysSet.has(`monster:${monsterItem._id}:${lang}`)}
                                  onMonsterClick={handleMonsterClick}
                                  tDialog={tDialog as (key: string, values?: Record<string, unknown>) => string}
                                />
                              ),
                            );
                          }

                          const playerItem = result.item;
                          if (selectedLang && !playerItem.languages.includes(selectedLang)) {
                            return [];
                          }

                          if (selectedLang) {
                            return [
                              <PlayerResultItem
                                key={`player-${playerItem._id}-${selectedLang}`}
                                playerItem={playerItem}
                                selectedLang={selectedLang}
                                isSelected={selectedItemKey === `player:${playerItem._id}:${selectedLang}`}
                                isQueued={queuedCharacterKeysSet.has(`player:${playerItem._id}:${selectedLang}`)}
                                onPlayerClick={handlePlayerClick}
                                tDialog={tDialog as (key: string, values?: Record<string, unknown>) => string}
                                tClasses={tClasses}
                              />,
                            ];
                          }

                          return codexPlayerLangsVisibleInAllLanguagesSearch(playerItem, searchQuery).map(
                            (lang: string) => (
                              <PlayerResultItem
                                key={`player-${playerItem._id}-${lang}`}
                                playerItem={playerItem}
                                selectedLang={selectedLang}
                                pinnedLang={lang}
                                isSelected={selectedItemKey === `player:${playerItem._id}:${lang}`}
                                isQueued={queuedCharacterKeysSet.has(`player:${playerItem._id}:${lang}`)}
                                onPlayerClick={handlePlayerClick}
                                tDialog={tDialog as (key: string, values?: Record<string, unknown>) => string}
                                tClasses={tClasses}
                              />
                            ),
                          );
                        })}
                      </div>
                      {hasMore && visibleCount > 0 && (
                        <div className="flex justify-center pt-4 pb-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={loadMore}
                            disabled={isLoadingMore}
                            className="w-full">
                            {isLoadingMore ? (
                              <>
                                <Loader2 className="size-4 animate-spin mr-2" />
                                {tDialog("searching")}
                              </>
                            ) : (
                              tDialog("loadMore")
                            )}
                          </Button>
                        </div>
                      )}
                      {visibleCount > 0 && (
                        <div className="text-center text-xs text-muted-foreground py-2">
                          {tDialog("resultsCount", {
                            count: visibleCount,
                            plural: visibleCount > 1 ? tDialog("resultsPlural") : "",
                            more: hasMore ? tDialog("resultsMore") : "",
                          })}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })()
              )}
            </div>
          </div>

          <div
            className={`min-h-[45vh] w-full flex-1 flex-col overflow-hidden p-4 md:p-6 lg:min-h-0 lg:w-3/4 ${showMobileDetails ? "flex" : "hidden lg:flex"}`}>
            <Button
              type="button"
              variant="ghost"
              className="lg:hidden self-start shrink-0 mb-2 px-2"
              onClick={() => setShowMobileDetails(false)}
              aria-label={tMagic("backToList")}>
              <ArrowLeft className="size-4 mr-2" />
              {tMagic("backToList")}
            </Button>
            {selectedMonster && selectedPreviewCodexItem && selectedItemKey ? (
              <div className="flex flex-col flex-1 min-h-0 pr-0 lg:pr-2 overflow-visible lg:overflow-hidden">
                {(() => {
                  const firstColon = selectedItemKey.indexOf(":");
                  const rest = firstColon >= 0 ? selectedItemKey.slice(firstColon + 1) : selectedItemKey;
                  const secondColon = rest.indexOf(":");
                  const previewLang = secondColon >= 0 ? rest.slice(secondColon + 1) : userLocale;
                  const langs = codexDeclaredPreviewLangs(selectedPreviewCodexItem.languages);
                  return (
                    <>
                      <CodexPreviewLanguageBar
                        availableLangs={langs}
                        currentLang={previewLang}
                        disabled={previewLangResolving}
                        onSelectLang={(l) => {
                          if (selectedEntryKind === "monster" && selectedCodexMonster) {
                            handleMonsterClick(selectedCodexMonster, l, { fromPreviewLangBar: true });
                          } else if (selectedEntryKind === "player" && selectedCodexPlayer) {
                            handlePlayerClick(selectedCodexPlayer, l, { fromPreviewLangBar: true });
                          }
                        }}
                        onUndo={handlePreviewLangUndo}
                        canUndo={previewLangStack.length > 0}
                        label={tDialog("preview.availableLanguages")}
                        undoLabel={tDialog("preview.previousLanguage")}
                        undoButtonLabel={tDialog("preview.previousLanguageButton")}
                        getLanguageAriaLabel={(l) => tDialog(`languageFilter.${l}`)}
                      />
                      {previewTranslationError ? (
                        <p className="text-sm text-red-500 shrink-0 -mt-2 mb-2">{previewTranslationError}</p>
                      ) : null}
                    </>
                  );
                })()}
                <div className="min-h-0 flex-1 overflow-visible lg:overflow-hidden">
                  <MonsterPreview monster={selectedMonster} />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                {tDialog("selectEntry")}
              </div>
            )}
          </div>
        </div>

      {!embedded ? (
        <DialogFooter
          className={cn(
            "shrink-0 gap-2 border-t border-frame px-4 py-3 sm:flex-col sm:justify-start md:flex-col lg:flex-row lg:items-center lg:gap-3 lg:px-6 lg:py-4",
            canBatchImport && isMultiSelectionMode ? "lg:justify-between" : "lg:justify-end",
          )}>
          {canBatchImport && isMultiSelectionMode ? (
            <Popover
              open={selectionDetailsOpen}
              onOpenChange={setSelectionDetailsOpen}>
              <PopoverTrigger
                type="button"
                className="flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-md py-1 text-left text-sm font-medium text-primary-light transition-colors hover:text-primary-light/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:w-auto lg:max-w-md">
                <ChevronDown
                  className={cn("size-4 shrink-0 transition-transform", !selectionDetailsOpen && "rotate-180")}
                  aria-hidden="true"
                />
                <span
                  className="min-w-0 truncate"
                  aria-live="polite">
                  {tDialog("selectionCount", { count: characterQueue.length })}
                </span>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                aria-label={tDialog("selectionDetailsList")}
                className="w-[min(28rem,calc(100vw-2rem))] max-w-none p-1.5">
                <ul className="flex max-h-60 flex-col gap-0.5 overflow-y-auto pr-1 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb [&::-webkit-scrollbar-thumb]:hover:bg-scrollbar-thumb-hover [&::-webkit-scrollbar-track]:bg-scrollbar-track">
                  {characterQueue.map(({ key, selection }) => {
                    const displayName = characterDisplayName(selection) || tDialog("unknownEntry");
                    const kindLabel =
                      selection.kind === "player"
                        ? tDialog("entityTypeFilter.players")
                        : tDialog("entityTypeFilter.monsters");
                    return (
                      <li
                        key={key}
                        className="flex items-center gap-1 rounded-sm px-1.5 py-1 hover:bg-purple/10">
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{displayName}</span>
                          <span className="block truncate text-xs text-muted-foreground">{kindLabel}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemoveFromQueue(key)}
                          aria-label={tDialog("removeEntryFromSelection", { name: displayName })}
                          className="size-7 shrink-0 text-muted-foreground hover:text-destructive">
                          <X
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </PopoverContent>
            </Popover>
          ) : null}
          <div className="flex w-full min-w-0 items-center justify-end gap-1.5 sm:gap-2 lg:w-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={batchCreateInProgress}
              className="shrink-0">
              {tDialog("cancel")}
            </Button>
            {!browseOnly ? (
              canBatchImport && (isMultiSelectionMode || selectedMonster) ? (
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 sm:border-l sm:border-border sm:pl-3">
                  {isMultiSelectionMode ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon-sm"
                        onClick={handleToggleQueueSelection}
                        disabled={characterActionsDisabled}
                        aria-pressed={isCurrentCharacterQueued}
                        aria-label={
                          isCurrentCharacterQueued ? tDialog("removeFromSelection") : tDialog("selectThisEntry")
                        }
                        className={cn(
                          "shrink-0 sm:size-auto sm:h-8 sm:px-3",
                          isCurrentCharacterQueued && "border-destructive/50 text-destructive hover:bg-destructive/5",
                        )}>
                        {isCurrentCharacterQueued ? (
                          <ListMinus
                            className="size-4"
                            aria-hidden="true"
                          />
                        ) : (
                          <ListPlus
                            className="size-4"
                            aria-hidden="true"
                          />
                        )}
                        <span className="hidden sm:inline">
                          {isCurrentCharacterQueued ? tDialog("removeFromSelection") : tDialog("selectThisEntry")}
                        </span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddSelection}
                        disabled={batchCreateInProgress}
                        aria-busy={batchCreateInProgress}
                        aria-label={tDialog("addSelection", { count: characterQueue.length })}
                        className="shrink-0 gap-1 px-2 sm:px-3">
                        <Layers
                          className="size-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-semibold tabular-nums sm:hidden">{characterQueue.length}</span>
                        <span className="hidden truncate sm:inline">
                          {tDialog("addSelection", { count: characterQueue.length })}
                        </span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon-sm"
                        onClick={handleToggleQueueSelection}
                        disabled={characterActionsDisabled}
                        aria-pressed={isCurrentCharacterQueued}
                        aria-label={tDialog("selectThisEntry")}
                        className="shrink-0 sm:size-auto sm:h-8 sm:px-3">
                        <ListPlus
                          className="size-4"
                          aria-hidden="true"
                        />
                        <span className="hidden sm:inline">{tDialog("selectThisEntry")}</span>
                      </Button>
                      <Button
                        ref={validateButtonRef}
                        type="button"
                        size="sm"
                        onClick={handleValidate}
                        disabled={characterActionsDisabled}>
                        {tDialog("validate")}
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <Button
                  ref={validateButtonRef}
                  type="button"
                  onClick={handleValidate}
                  disabled={!selectedMonster || batchCreateInProgress}>
                  {tDialog("validate")}
                </Button>
              )
            ) : null}
          </div>
        </DialogFooter>
      ) : null}
    </>
  );

  if (embedded) {
    if (!open) {
      return null;
    }

    return <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{dialogBody}</div>;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
          return;
        }
        onOpenChange(nextOpen);
      }}>
      <DialogContent
        className="flex h-[90vh] flex-col gap-0 p-0 sm:w-4/5 [&>[data-slot=dialog-close]]:top-5"
        data-own-dialog=""
        onEscapeKeyDown={(event) => {
          if (stackedDialogGateRef.current?.shouldIgnoreDismiss()) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          const target = event.detail.originalEvent?.target ?? event.target;
          if (shouldPreventDialogOutsideDismiss(target)) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          const target = event.detail.originalEvent?.target ?? event.target;
          if (shouldPreventDialogOutsideDismiss(target)) {
            event.preventDefault();
          }
        }}
        onFocusOutside={(event) => {
          if (shouldPreventDialogOutsideDismiss(event.target)) {
            event.preventDefault();
          }
        }}>
        {dialogBody}
      </DialogContent>
    </Dialog>
  );
}
