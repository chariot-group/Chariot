"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spell } from "@/types/character";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/request";
import CodexService, { CodexSpellItem } from "@/services/CodexService";
import SpellDisplay from "@/components/character/tabContents/magic/SpellDisplay";
import CodexPreviewLanguageBar from "@/components/character/CodexPreviewLanguageBar";
import {
  Search,
  Loader2,
  BadgeCheck,
  FileBadge,
  ArrowLeft,
  ChevronDown,
  Check,
  ListPlus,
  ListMinus,
  Layers,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  codexDeclaredPreviewLangs,
  codexLocaleFlagEmoji,
  codexSpellLangsVisibleInAllLanguagesSearch,
  codexSpellTranslationLooksUsable,
} from "@/utils/codexLocale.utils";
import type { SpellClass } from "@/constants/spellClasses";
import { SPELL_CLASSES, spellClassTranslationKey } from "@/constants/spellClasses";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

interface CodexSpellSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSpellSelected: (spell: Partial<Spell>) => void;
  accentColor: string;
}

import {
  isSpellQueued as isSpellQueuedInQueue,
  queuedSpellKeys as buildQueuedSpellKeys,
  toggleSpellInQueue,
  type QueuedSpellEntry,
} from "@/lib/codexSpellQueue";

function SpellResultItem({
  spellItem,
  selectedLang,
  pinnedLang,
  isSelected,
  isQueued,
  onSpellClick,
  tDialog,
  tMagic,
  t,
}: {
  spellItem: CodexSpellItem;
  selectedLang: string | null;
  /** En mode « toutes les langues », une ligne par langue : drapeau sur la carte */
  pinnedLang?: string | null;
  isSelected: boolean;
  isQueued: boolean;
  onSpellClick: (spell: CodexSpellItem, lang: string) => void | Promise<void>;
  tDialog: (key: string) => string;
  tMagic: (key: string, values?: Record<string, unknown>) => string;
  t: (key: string) => string;
}) {
  const tGeneral = useTranslations("characterDetail.player");

  const displayLang =
    pinnedLang ??
    (selectedLang && spellItem.languages.includes(selectedLang) ? selectedLang : spellItem.languages[0] || "en");

  const translation = spellItem.translations[displayLang];
  if (!translation) return null;

  const handleCardClick = () => {
    onSpellClick(spellItem, displayLang);
  };

  const resultKey = `${spellItem._id}:${displayLang}`;

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        "cursor-pointer p-3 border border-transparent transition-colors duration-200 hover:bg-purple/5 hover:border-purple/40",
        isSelected && "border-purple border-2 bg-purple/10",
        isQueued && !isSelected && "border-purple/60 bg-purple/5",
      )}
      aria-current={isSelected ? "true" : undefined}
      data-spell-key={resultKey}>
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-1 min-w-0 gap-2 items-start">
            {pinnedLang && codexLocaleFlagEmoji(pinnedLang) ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="text-[1.35rem] leading-none shrink-0 pt-0.5 select-none"
                    aria-label={tDialog(`languageFilter.${pinnedLang}`)}>
                    {codexLocaleFlagEmoji(pinnedLang)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tDialog(`languageFilter.${pinnedLang}`)}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm md:text-base">{translation.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {tMagic("spellLevel", { level: translation.level })} • {translation.school}
              </div>
              {spellItem.classes && spellItem.classes.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  <strong>{tGeneral("general.classes")}:</strong>{" "}
                  {spellItem.classes.map((c) => t(c.charAt(0).toUpperCase() + c.slice(1))).join(", ")}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex gap-1.5">
              {isQueued && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="cursor-help"
                      aria-hidden="true">
                      <Check className="size-5 text-purple" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tDialog("queuedInSelection")}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {spellItem.tag === 1 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <BadgeCheck className="size-5 text-green-600" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tDialog("validatedByChariot")}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {translation.srd && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <FileBadge className="size-5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tDialog("srdContent")}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function CodexSpellSearchDialog({
  open,
  onOpenChange,
  onSpellSelected,
  accentColor,
}: CodexSpellSearchDialogProps) {
  const userLocale = useLocale() as Locale;
  const tMagic = useTranslations("characterDetail.magic");
  const tDialog = useTranslations("characterDetail.magic.codexDialog");
  const tClasses = useTranslations("classes");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<SpellClass[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<CodexSpellItem[]>([]);
  const [selectedSpell, setSelectedSpell] = useState<Partial<Spell> | null>(null);
  const [selectedCodexSpell, setSelectedCodexSpell] = useState<CodexSpellItem | null>(null);
  const [previewLangStack, setPreviewLangStack] = useState<string[]>([]);
  /** Clé `${_id}:${lang}` pour distinguer la même entrée codex en plusieurs langues */
  const [selectedSpellKey, setSelectedSpellKey] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [previewLangResolving, setPreviewLangResolving] = useState(false);
  const [previewTranslationError, setPreviewTranslationError] = useState<string | null>(null);
  const [spellQueue, setSpellQueue] = useState<QueuedSpellEntry[]>([]);
  const isLoadingRef = useRef(false);
  const spellPreviewScrollRef = useRef<HTMLDivElement>(null);

  const ITEMS_PER_PAGE = 20;

  const classFilterLabel = useMemo(() => {
    if (selectedClasses.length === 0) {
      return tDialog("classFilter.all");
    }
    return selectedClasses.map((spellClass) => tClasses(spellClassTranslationKey(spellClass))).join(", ");
  }, [selectedClasses, tClasses, tDialog]);

  const toggleClassFilter = useCallback((spellClass: SpellClass) => {
    setSelectedClasses((prev) =>
      prev.includes(spellClass) ? prev.filter((value) => value !== spellClass) : [...prev, spellClass],
    );
  }, []);

  const queuedSpellKeys = useMemo(() => buildQueuedSpellKeys(spellQueue), [spellQueue]);

  const isCurrentSpellQueued = selectedSpellKey ? isSpellQueuedInQueue(spellQueue, selectedSpellKey) : false;

  useEffect(() => {
    if (!selectedSpellKey) return;
    spellPreviewScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedSpellKey]);

  // Recherche avec debounce
  const searchSpells = useCallback(
    async (
      query: string,
      page: number = 1,
      append: boolean = false,
      apiLang?: string | null,
      apiClasses?: SpellClass[],
      apiLevel?: number | null,
    ) => {
      const lang = apiLang !== undefined ? apiLang : selectedLang;
      const classes = apiClasses !== undefined ? apiClasses : selectedClasses;
      const level = apiLevel !== undefined ? apiLevel : selectedLevel;
      // Éviter les appels multiples simultanés
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
        const response = await CodexService.searchSpells(
          query,
          lang,
          page,
          ITEMS_PER_PAGE,
          classes.length > 0 ? classes : undefined,
          level ?? undefined,
        );
        const newResults = response.data || [];

        // Vérifier si on a atteint la fin en comparant le nombre d'éléments reçus
        const reachedEnd = newResults.length < ITEMS_PER_PAGE;

        // Mettre à jour les résultats en utilisant la forme fonctionnelle
        setSearchResults((prev) => {
          if (append) {
            // Éviter les doublons en vérifiant les _id
            const existingIds = new Set(prev.map((item) => item._id));
            const uniqueNewResults = newResults.filter((item) => !existingIds.has(item._id));
            return [...prev, ...uniqueNewResults];
          } else {
            return newResults;
          }
        });

        // Mettre à jour hasMore en fonction de la fin détectée
        setHasMore(!reachedEnd);
        setCurrentPage(response.pagination.page);
      } catch (err) {
        console.error("Error searching spells:", err);
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
    [selectedLang, selectedClasses, selectedLevel, tDialog, ITEMS_PER_PAGE],
  );

  // Effet pour lancer la recherche avec debounce
  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      searchSpells(searchQuery, 1, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedLang, selectedClasses, selectedLevel, searchSpells]);

  // Réinitialiser lors de l'ouverture du dialog
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setSelectedLang(userLocale);
      setSelectedClasses([]);
      setSelectedLevel(null);
      setSearchResults([]);
      setSelectedSpell(null);
      setSelectedCodexSpell(null);
      setPreviewLangStack([]);
      setSelectedSpellKey(null);
      setShowMobileDetails(false);
      setPreviewLangResolving(false);
      setPreviewTranslationError(null);
      setSpellQueue([]);
      setError(null);
      setCurrentPage(1);
      setHasMore(false);
      isLoadingRef.current = false;
      // Charger les données initiales (lang explicite : selectedLang pas encore à jour dans la closure)
      searchSpells("", 1, false, userLocale, [], null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Charger plus de résultats
  const loadMore = () => {
    if (!isLoadingMore && !isLoadingRef.current && hasMore) {
      const nextPage = currentPage + 1;
      searchSpells(searchQuery, nextPage, true);
    }
  };

  const handleSpellClick = async (
    codexSpellItem: CodexSpellItem,
    lang: string,
    options?: { fromPreviewLangBar?: boolean },
  ) => {
    const fromPreview = options?.fromPreviewLangBar ?? false;
    const prevKey = selectedSpellKey;
    let currentLangForSameId: string | undefined;
    if (prevKey) {
      const colon = prevKey.lastIndexOf(":");
      const prevId = colon >= 0 ? prevKey.slice(0, colon) : prevKey;
      const prevLang = colon >= 0 ? prevKey.slice(colon + 1) : undefined;
      if (prevId === codexSpellItem._id && prevLang) {
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

    let item = codexSpellItem;
    const shouldHydrate = fromPreview || !codexSpellTranslationLooksUsable(item.translations[lang]);

    if (shouldHydrate) {
      setPreviewLangResolving(true);
      try {
        const forLang = await CodexService.getSpellById(item._id, lang);
        if (forLang) {
          item = CodexService.overlaySpellTranslationsFromDetail(item, forLang, [lang]);
        }
        if (!codexSpellTranslationLooksUsable(item.translations[lang])) {
          const unscoped = await CodexService.getSpellById(item._id);
          if (unscoped) {
            item = CodexService.overlaySpellTranslationsFromDetail(item, unscoped, [lang]);
            if (!codexSpellTranslationLooksUsable(item.translations[lang])) {
              item = CodexService.mergeSpellFillMissingTranslations(item, unscoped);
            }
          }
        }
        if (!codexSpellTranslationLooksUsable(item.translations[lang])) {
          setPreviewTranslationError(tDialog("preview.loadTranslationError"));
          return;
        }
      } finally {
        setPreviewLangResolving(false);
      }
    }

    try {
      const convertedSpell = CodexService.convertToChariotSpell(item, lang);
      setSelectedCodexSpell(item);
      setSelectedSpell(convertedSpell);
      setSelectedSpellKey(`${item._id}:${lang}`);
      setShowMobileDetails(true);
    } catch {
      setPreviewTranslationError(tDialog("preview.loadTranslationError"));
    }
  };

  const handlePreviewLangUndo = () => {
    if (!selectedCodexSpell || previewLangStack.length === 0) return;
    setPreviewTranslationError(null);
    const prevLang = previewLangStack[previewLangStack.length - 1];
    const convertedSpell = CodexService.convertToChariotSpell(selectedCodexSpell, prevLang);
    setSelectedSpell(convertedSpell);
    setSelectedSpellKey(`${selectedCodexSpell._id}:${prevLang}`);
    setPreviewLangStack((s) => s.slice(0, -1));
  };

  const handleUseThisSpell = () => {
    if (selectedSpell) {
      onSpellSelected(selectedSpell);
      onOpenChange(false);
    }
  };

  const handleToggleQueueSelection = () => {
    if (!selectedSpell || !selectedSpellKey) return;
    setSpellQueue((prev) => toggleSpellInQueue(prev, selectedSpellKey, selectedSpell));
  };

  const handleAddSelection = () => {
    if (spellQueue.length === 0) return;

    spellQueue.forEach(({ spell }) => onSpellSelected(spell));
    onOpenChange(false);
  };

  const isMultiSelectionMode = spellQueue.length > 0;
  const spellActionsDisabled = !selectedSpell || previewLangResolving;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}>
      <DialogContent className="sm:w-4/5 h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-2xl">{tDialog("title")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4 p-4 md:p-6 min-h-0">
          {/* Partie gauche : Recherche et résultats */}
          <div
            className={`flex flex-col gap-4 w-full lg:w-1/4 overflow-hidden min-h-0 lg:min-h-full ${showMobileDetails ? "hidden lg:flex" : "flex"}`}>
            {/* Barre de recherche et filtres */}
            <div className="flex flex-col gap-2 w-full">
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
              <div className="flex w-full min-w-0 flex-wrap gap-2">
                {/* Filtre de langue */}
                <Select
                  value={selectedLang ?? "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setSelectedLang(null);
                    } else if (value === "fr" || value === "en" || value === "es") {
                      setSelectedLang(value);
                    }
                  }}>
                  <SelectTrigger className="min-w-0 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tDialog("languageFilter.all")}</SelectItem>
                    <SelectItem value="fr">{tDialog("languageFilter.fr")}</SelectItem>
                    <SelectItem value="en">{tDialog("languageFilter.en")}</SelectItem>
                    <SelectItem value="es">{tDialog("languageFilter.es")}</SelectItem>
                  </SelectContent>
                </Select>
                {/* Filtre par niveau de sort */}
                <Select
                  value={selectedLevel === null ? "all" : String(selectedLevel)}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setSelectedLevel(null);
                      return;
                    }
                    const level = Number(value);
                    if (Number.isInteger(level) && level >= 0 && level <= 9) {
                      setSelectedLevel(level);
                    }
                  }}>
                  <SelectTrigger
                    className="min-w-0 flex-1"
                    aria-label={tDialog("levelFilter.ariaLabel")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tDialog("levelFilter.all")}</SelectItem>
                    {SPELL_LEVELS.map((level) => (
                      <SelectItem
                        key={level}
                        value={String(level)}>
                        {level === 0 ? tMagic("cantrips") : tMagic("spellLevelShort", { level })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Filtre par classe(s) */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    type="button"
                    aria-label={tDialog("classFilter.ariaLabel")}
                    className={cn(
                      "flex h-9 min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-[15px] bg-gray-middle-light px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      selectedClasses.length === 0 && "text-muted-foreground",
                    )}>
                    <span className="min-w-0 truncate text-left">{classFilterLabel}</span>
                    <ChevronDown
                      className="size-4 shrink-0 opacity-50"
                      aria-hidden="true"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="max-h-60 min-w-48 w-(--radix-dropdown-menu-trigger-width) overflow-y-auto">
                    <DropdownMenuItem
                      className="font-medium"
                      onSelect={() => setSelectedClasses([])}>
                      {tDialog("classFilter.all")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {SPELL_CLASSES.map((spellClass) => (
                      <DropdownMenuCheckboxItem
                        key={spellClass}
                        checked={selectedClasses.includes(spellClass)}
                        onCheckedChange={() => toggleClassFilter(spellClass)}
                        onSelect={(event) => event.preventDefault()}>
                        {tClasses(spellClassTranslationKey(spellClass))}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Résultats de recherche */}
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
                  // Calculer le nombre de résultats visibles
                  let visibleCount = 0;
                  if (selectedLang) {
                    visibleCount = searchResults.filter(
                      (item) => CodexService.getSpellTranslation(item, selectedLang) !== null,
                    ).length;
                  } else {
                    visibleCount = searchResults.reduce(
                      (count, item) => count + codexSpellLangsVisibleInAllLanguagesSearch(item, searchQuery).length,
                      0,
                    );
                  }

                  if (visibleCount === 0) {
                    return <div className="text-center py-8 text-sm text-muted-foreground">{tDialog("noResults")}</div>;
                  }

                  return (
                    <React.Fragment>
                      <div className="flex flex-col gap-2">
                        {searchResults.flatMap((spellItem) => {
                          if (selectedLang && !spellItem.languages.includes(selectedLang)) {
                            return [];
                          }

                          if (selectedLang) {
                            const resultKey = `${spellItem._id}:${selectedLang}`;
                            const isSelected = selectedSpellKey === resultKey;
                            return [
                              <SpellResultItem
                                key={`${spellItem._id}-${selectedLang}`}
                                spellItem={spellItem}
                                selectedLang={selectedLang}
                                isSelected={isSelected}
                                isQueued={queuedSpellKeys.has(resultKey)}
                                onSpellClick={handleSpellClick}
                                tDialog={tDialog}
                                tMagic={tMagic as (key: string, values?: Record<string, unknown>) => string}
                                t={tClasses}
                              />,
                            ];
                          }

                          return codexSpellLangsVisibleInAllLanguagesSearch(spellItem, searchQuery).map((lang) => {
                            const resultKey = `${spellItem._id}:${lang}`;
                            return (
                              <SpellResultItem
                                key={`${spellItem._id}-${lang}`}
                                spellItem={spellItem}
                                selectedLang={selectedLang}
                                pinnedLang={lang}
                                isSelected={selectedSpellKey === resultKey}
                                isQueued={queuedSpellKeys.has(resultKey)}
                                onSpellClick={handleSpellClick}
                                tDialog={tDialog}
                                tMagic={tMagic as (key: string, values?: Record<string, unknown>) => string}
                                t={tClasses}
                              />
                            );
                          });
                        })}
                      </div>
                      {/* Bouton Charger plus */}
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
                      {/* Indicateur de résultats */}
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

          {/* Partie droite : Affichage du sort sélectionné */}
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
            {selectedSpell && selectedCodexSpell && selectedSpellKey ? (
              <div className="flex flex-col flex-1 min-h-0 pr-0 lg:pr-2">
                {(() => {
                  const colon = selectedSpellKey.lastIndexOf(":");
                  const previewLang = colon >= 0 ? selectedSpellKey.slice(colon + 1) : userLocale;
                  const langs = codexDeclaredPreviewLangs(selectedCodexSpell.languages);
                  return (
                    <>
                      <CodexPreviewLanguageBar
                        availableLangs={langs}
                        currentLang={previewLang}
                        disabled={previewLangResolving}
                        onSelectLang={(l) => handleSpellClick(selectedCodexSpell, l, { fromPreviewLangBar: true })}
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
                <div
                  ref={spellPreviewScrollRef}
                  className="min-h-0 flex-1 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full">
                  <SpellDisplay
                    key={selectedSpellKey}
                    spell={selectedSpell as Spell}
                    accentColor={accentColor}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                {tDialog("selectSpell")}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t px-4 py-3 sm:flex-col sm:justify-start md:flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:px-6 lg:py-4">
          {isMultiSelectionMode ? (
            <p
              className="hidden text-sm font-medium text-purple lg:block"
              aria-live="polite">
              {tDialog("selectionCount", { count: spellQueue.length })}
            </p>
          ) : null}
          <div className="flex w-full min-w-0 items-center justify-end gap-1.5 sm:gap-2 lg:w-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="shrink-0">
              {tDialog("cancel")}
            </Button>

            {(isMultiSelectionMode || selectedSpell) && (
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 sm:border-l sm:border-border sm:pl-3">
                {isMultiSelectionMode ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={handleToggleQueueSelection}
                      disabled={spellActionsDisabled}
                      aria-pressed={isCurrentSpellQueued}
                      aria-label={
                        isCurrentSpellQueued ? tDialog("removeFromSelection") : tDialog("selectThisSpell")
                      }
                      className={cn(
                        "shrink-0 sm:size-auto sm:h-8 sm:px-3",
                        isCurrentSpellQueued
                          ? "border-destructive/50 text-destructive hover:bg-destructive/5"
                          : "border-purple/40 text-purple hover:bg-purple/5",
                      )}>
                      {isCurrentSpellQueued ? (
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
                        {isCurrentSpellQueued ? tDialog("removeFromSelection") : tDialog("selectThisSpell")}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddSelection}
                      aria-label={tDialog("addSelection", { count: spellQueue.length })}
                      className="h-8 shrink-0 gap-1 bg-purple px-2 hover:bg-purple/90 text-white sm:px-3">
                      <Layers
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-sm font-semibold tabular-nums sm:hidden">{spellQueue.length}</span>
                      <span className="hidden truncate sm:inline">
                        {tDialog("addSelection", { count: spellQueue.length })}
                      </span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={handleToggleQueueSelection}
                      disabled={spellActionsDisabled}
                      aria-pressed={isCurrentSpellQueued}
                      aria-label={tDialog("selectThisSpell")}
                      className="shrink-0 border-purple/40 text-purple hover:bg-purple/5 sm:size-auto sm:h-8 sm:px-3">
                      <ListPlus
                        className="size-4"
                        aria-hidden="true"
                      />
                      <span className="hidden sm:inline">{tDialog("selectThisSpell")}</span>
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      onClick={handleUseThisSpell}
                      disabled={spellActionsDisabled}
                      aria-label={tDialog("useThisSpell")}
                      className="shrink-0 bg-purple hover:bg-purple/90 text-white sm:size-auto sm:h-8 sm:px-3">
                      <Check
                        className="size-4"
                        aria-hidden="true"
                      />
                      <span className="hidden sm:inline">{tDialog("useThisSpell")}</span>
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
