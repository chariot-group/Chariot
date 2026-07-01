"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NPC } from "@/types/character";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/request";
import CodexService, {
  CodexMonsterItem,
  CodexPlayerItem,
  CodexPlayerTranslation,
  CodexSearchResultItem,
} from "@/services/CodexService";
import { Search, Loader2, BadgeCheck, FileBadge, ArrowLeft } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import MonsterPreview from "@/components/character/MonsterPreview";
import CodexPreviewLanguageBar from "@/components/character/CodexPreviewLanguageBar";
import { formatChallengeRating } from "@/utils/challengeRating.utils";
import {
  codexDeclaredPreviewLangs,
  codexLocaleFlagEmoji,
  codexMonsterLangsVisibleInAllLanguagesSearch,
  codexMonsterTranslationLooksUsable,
  codexPlayerLangsVisibleInAllLanguagesSearch,
  codexPlayerTranslationLooksUsable,
} from "@/utils/codexLocale.utils";
import { GAME_SYSTEMS, type CodexGameSystem } from "@/constants/gameSystems";
import React from "react";

type CodexEntityTypeFilter = "both" | "monsters" | "players";

interface MonsterCodexDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMonsterSelected: (monster: Partial<NPC>) => void;
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

function MonsterResultItem({
  monsterItem,
  selectedLang,
  pinnedLang,
  isSelected,
  onMonsterClick,
  tDialog,
}: {
  monsterItem: CodexMonsterItem;
  selectedLang: string | null;
  pinnedLang?: string | null;
  isSelected: boolean;
  onMonsterClick: (monster: CodexMonsterItem, lang: string) => void | Promise<void>;
  tDialog: (key: string, values?: Record<string, unknown>) => string;
}) {
  const tCommon = useTranslations("common");

  const displayLang =
    pinnedLang ??
    (selectedLang && monsterItem.languages.includes(selectedLang) ? selectedLang : monsterItem.languages[0] || "en");

  const translation = monsterItem.translations[displayLang];
  if (!translation) return null;

  return (
    <Card
      onClick={() => onMonsterClick(monsterItem, displayLang)}
      className={`cursor-pointer p-3 border border-transparent transition-colors duration-200 hover:bg-purple/5 hover:border-purple/40 ${
        isSelected ? "border-purple border-2 bg-purple/10" : ""
      }`}>
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-1 min-w-0 gap-2 items-start">
            {pinnedLang && codexLocaleFlagEmoji(pinnedLang) ? (
              <InfoTooltip
                content={tDialog(`languageFilter.${pinnedLang}`)}
                side="top"
                moreInfoLabel={tDialog(`languageFilter.${pinnedLang}`)}>
                <span
                  className="text-[1.35rem] leading-none shrink-0 pt-0.5 select-none cursor-help"
                  aria-label={tDialog(`languageFilter.${pinnedLang}`)}>
                  {codexLocaleFlagEmoji(pinnedLang)}
                </span>
              </InfoTooltip>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm md:text-base">{translation.firstname}</div>
              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-1">
                <InfoTooltip
                  content={tCommon("challengeRatingTooltip")}
                  side="top"
                  moreInfoLabel={tCommon("challengeRatingTooltip")}>
                  <abbr className="no-underline cursor-help">{tDialog("crLabel")}</abbr>
                </InfoTooltip>
                {tDialog("monsterInfo", {
                  cr: formatChallengeRating(translation.challenge?.challengeRating),
                  type: translation.profile?.type,
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex gap-1.5">
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
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PlayerResultItem({
  playerItem,
  selectedLang,
  pinnedLang,
  isSelected,
  onPlayerClick,
  tDialog,
  tClasses,
}: {
  playerItem: CodexPlayerItem;
  selectedLang: string | null;
  pinnedLang?: string | null;
  isSelected: boolean;
  onPlayerClick: (player: CodexPlayerItem, lang: string) => void | Promise<void>;
  tDialog: (key: string, values?: Record<string, unknown>) => string;
  tClasses: (key: string) => string;
}) {
  const displayLang =
    pinnedLang ??
    (selectedLang && playerItem.languages.includes(selectedLang) ? selectedLang : playerItem.languages[0] || "en");

  const translation = playerItem.translations[displayLang];
  if (!translation) return null;

  return (
    <Card
      onClick={() => onPlayerClick(playerItem, displayLang)}
      className={`cursor-pointer p-3 border border-transparent transition-colors duration-200 hover:bg-purple/5 hover:border-purple/40 ${
        isSelected ? "border-purple border-2 bg-purple/10" : ""
      }`}>
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-1 min-w-0 gap-2 items-start">
            {pinnedLang && codexLocaleFlagEmoji(pinnedLang) ? (
              <InfoTooltip
                content={tDialog(`languageFilter.${pinnedLang}`)}
                side="top"
                moreInfoLabel={tDialog(`languageFilter.${pinnedLang}`)}>
                <span
                  className="text-[1.35rem] leading-none shrink-0 pt-0.5 select-none cursor-help"
                  aria-label={tDialog(`languageFilter.${pinnedLang}`)}>
                  {codexLocaleFlagEmoji(pinnedLang)}
                </span>
              </InfoTooltip>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm md:text-base">{translation.firstname}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {tDialog("playerInfo", {
                  level: translation.progression?.level ?? 1,
                  detail: formatPlayerListDetail(translation, tClasses),
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {playerItem.tag === 1 ? (
              <BadgeCheck
                className="size-5 text-green-600"
                aria-label={tDialog("validatedByChariot")}
              />
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function MonsterCodexDialog({ open, onOpenChange, onMonsterSelected }: MonsterCodexDialogProps) {
  const userLocale = useLocale() as Locale;
  const tDialog = useTranslations("characterDetail.magic.monsterCodexDialog");
  const tMagic = useTranslations("characterDetail.magic");
  const tClasses = useTranslations("classes");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [selectedGameSystem, setSelectedGameSystem] = useState<CodexGameSystem | null>(null);
  const [entityTypeFilter, setEntityTypeFilter] = useState<CodexEntityTypeFilter>("both");
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
  const isLoadingRef = useRef(false);

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
      setSelectedGameSystem(null);
      setEntityTypeFilter("both");
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
      setCurrentPage(1);
      setHasMore(false);
      isLoadingRef.current = false;
      searchCodex("", 1, false, userLocale, null, "both");
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
  ) => {
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
          return;
        }
        const populated = await CodexService.populateMonstersList([item]);
        item = populated[0];
        if (!codexMonsterTranslationLooksUsable(item.translations[lang])) {
          setPreviewTranslationError(tDialog("preview.loadTranslationError"));
          return;
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
    } catch {
      setPreviewTranslationError(tDialog("preview.loadTranslationError"));
    }
  };

  const handlePlayerClick = async (
    codexPlayerItem: CodexPlayerItem,
    lang: string,
    options?: { fromPreviewLangBar?: boolean },
  ) => {
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
          return;
        }
        const populated = await CodexService.populatePlayersList([item]);
        item = populated[0];
        if (!codexPlayerTranslationLooksUsable(item.translations[lang])) {
          setPreviewTranslationError(tDialog("preview.loadTranslationError"));
          return;
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
    } catch {
      setPreviewTranslationError(tDialog("preview.loadTranslationError"));
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

  const handleValidate = () => {
    if (selectedMonster) {
      onMonsterSelected(selectedMonster);
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

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}>
      <DialogContent className="sm:w-4/5 h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-2xl">{tDialog("title")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4 p-4 md:p-6 min-h-0">
          <div
            className={`flex flex-col gap-4 w-full lg:w-1/4 min-h-0 lg:min-h-full ${showMobileDetails ? "hidden lg:flex" : "flex"}`}>
            <div className="flex shrink-0 flex-col gap-2 w-full overflow-visible">
              <div className="relative w-full">
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
                value={entityTypeFilter}
                onValueChange={(value) => {
                  if (value === "both" || value === "monsters" || value === "players") {
                    setEntityTypeFilter(value);
                  }
                }}>
                <SelectTrigger
                  className="w-full focus-visible:ring-inset"
                  aria-label={tDialog("entityTypeFilter.ariaLabel")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">{tDialog("entityTypeFilter.both")}</SelectItem>
                  <SelectItem value="monsters">{tDialog("entityTypeFilter.monsters")}</SelectItem>
                  <SelectItem value="players">{tDialog("entityTypeFilter.players")}</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex w-full min-w-0 gap-2">
                <Select
                  value={selectedGameSystem ?? "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setSelectedGameSystem(null);
                    } else if (GAME_SYSTEMS.includes(value as CodexGameSystem)) {
                      setSelectedGameSystem(value as CodexGameSystem);
                    }
                  }}>
                  <SelectTrigger
                    className="min-w-0 flex-1 focus-visible:ring-inset"
                    aria-label={tDialog("gameSystemFilter.ariaLabel")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tDialog("gameSystemFilter.all")}</SelectItem>
                    {GAME_SYSTEMS.map((gameSystem) => (
                      <SelectItem
                        key={gameSystem}
                        value={gameSystem}>
                        {tDialog(`gameSystemFilter.${gameSystem}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedLang ?? "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setSelectedLang(null);
                    } else if (value === "fr" || value === "en" || value === "es") {
                      setSelectedLang(value);
                    }
                  }}>
                  <SelectTrigger
                    className="min-w-0 flex-1 focus-visible:ring-inset"
                    aria-label={tDialog("languageFilter.ariaLabel")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tDialog("languageFilter.all")}</SelectItem>
                    <SelectItem value="fr">{tDialog("languageFilter.fr")}</SelectItem>
                    <SelectItem value="en">{tDialog("languageFilter.en")}</SelectItem>
                    <SelectItem value="es">{tDialog("languageFilter.es")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground shrink-0 py-1"
              aria-label={tDialog("legendLabel")}>
              <span className="flex items-center gap-1">
                <BadgeCheck
                  className="size-3.5 text-green-600 shrink-0"
                  aria-hidden="true"
                />
                {tDialog("validatedByChariot")}
              </span>
              <span className="flex items-center gap-1">
                <FileBadge
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
                {tDialog("srdContent")}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full">
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
                      <div className="flex flex-col gap-2">
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
                            variant="outline"
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
            className={`flex flex-col flex-1 min-h-0 w-full lg:w-3/4 overflow-hidden min-h-[45vh] lg:min-h-0 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-4 ${showMobileDetails ? "flex" : "hidden lg:flex"}`}>
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

        <DialogFooter className="px-6 pb-6 pt-4 border-t shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}>
            {tDialog("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleValidate}
            disabled={!selectedMonster}
            className="bg-purple hover:bg-purple/90 text-white">
            {tDialog("validate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
