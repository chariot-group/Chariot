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
import CodexService, { CodexMonsterItem } from "@/services/CodexService";
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
} from "@/utils/codexLocale.utils";
import { GAME_SYSTEMS, type CodexGameSystem } from "@/constants/gameSystems";
import React from "react";

interface MonsterCodexDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMonsterSelected: (monster: Partial<NPC>) => void;
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
  /** En mode « toutes les langues », une ligne par langue : drapeau sur la carte */
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

  const handleCardClick = () => {
    onMonsterClick(monsterItem, displayLang);
  };

  return (
    <Card
      onClick={handleCardClick}
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

export default function MonsterCodexDialog({ open, onOpenChange, onMonsterSelected }: MonsterCodexDialogProps) {
  const userLocale = useLocale() as Locale;
  const tDialog = useTranslations("characterDetail.magic.monsterCodexDialog");
  const tMagic = useTranslations("characterDetail.magic");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [selectedGameSystem, setSelectedGameSystem] = useState<CodexGameSystem | null>(null);
  const [searchResults, setSearchResults] = useState<CodexMonsterItem[]>([]);
  const [selectedMonster, setSelectedMonster] = useState<Partial<NPC> | null>(null);
  const [selectedCodexMonster, setSelectedCodexMonster] = useState<CodexMonsterItem | null>(null);
  /** Pile des langues de prévisualisation (barre latérale) pour revenir en arrière */
  const [previewLangStack, setPreviewLangStack] = useState<string[]>([]);
  /** Clé `${_id}:${lang}` pour distinguer la même entrée codex en plusieurs langues */
  const [selectedMonsterKey, setSelectedMonsterKey] = useState<string | null>(null);
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

  // Recherche avec debounce
  const searchMonsters = useCallback(
    async (
      query: string,
      page: number = 1,
      append: boolean = false,
      apiLang?: string | null,
      apiGameSystem?: CodexGameSystem | null,
    ) => {
      const lang = apiLang !== undefined ? apiLang : selectedLang;
      const gameSystem = apiGameSystem !== undefined ? apiGameSystem : selectedGameSystem;
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
        const response = await CodexService.searchMonsters(
          query,
          lang,
          page,
          ITEMS_PER_PAGE,
          gameSystem ?? undefined,
        );
        const rawResults = response.data || [];
        const newResults = await CodexService.populateMonstersList(rawResults);

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
        console.error("Error searching monsters:", err);
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
    [selectedLang, selectedGameSystem, tDialog, ITEMS_PER_PAGE],
  );

  // Effet pour lancer la recherche avec debounce
  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      searchMonsters(searchQuery, 1, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedLang, selectedGameSystem, searchMonsters]);

  // Réinitialiser lors de l'ouverture du dialog
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setSelectedLang(userLocale);
      setSelectedGameSystem(null);
      setSearchResults([]);
      setSelectedMonster(null);
      setSelectedCodexMonster(null);
      setPreviewLangStack([]);
      setSelectedMonsterKey(null);
      setShowMobileDetails(false);
      setPreviewLangResolving(false);
      setPreviewTranslationError(null);
      setError(null);
      setCurrentPage(1);
      setHasMore(false);
      isLoadingRef.current = false;
      // Charger les données initiales (lang explicite : selectedLang pas encore à jour dans la closure)
      searchMonsters("", 1, false, userLocale, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Charger plus de résultats
  const loadMore = () => {
    if (!isLoadingMore && !isLoadingRef.current && hasMore) {
      const nextPage = currentPage + 1;
      searchMonsters(searchQuery, nextPage, true);
    }
  };

  const handleMonsterClick = async (
    codexMonsterItem: CodexMonsterItem,
    lang: string,
    options?: { fromPreviewLangBar?: boolean },
  ) => {
    const fromPreview = options?.fromPreviewLangBar ?? false;
    const prevKey = selectedMonsterKey;
    let currentLangForSameId: string | undefined;
    if (prevKey) {
      const colon = prevKey.lastIndexOf(":");
      const prevId = colon >= 0 ? prevKey.slice(0, colon) : prevKey;
      const prevLang = colon >= 0 ? prevKey.slice(colon + 1) : undefined;
      if (prevId === codexMonsterItem._id && prevLang) {
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
      setSelectedMonster(convertedMonster);
      setSelectedMonsterKey(`${item._id}:${lang}`);
      setShowMobileDetails(true);
    } catch {
      setPreviewTranslationError(tDialog("preview.loadTranslationError"));
    }
  };

  const handlePreviewLangUndo = () => {
    if (!selectedCodexMonster || previewLangStack.length === 0) return;
    setPreviewTranslationError(null);
    const prevLang = previewLangStack[previewLangStack.length - 1];
    const convertedMonster = CodexService.convertToChariotNPC(selectedCodexMonster, prevLang);
    setSelectedMonster(convertedMonster);
    setSelectedMonsterKey(`${selectedCodexMonster._id}:${prevLang}`);
    setPreviewLangStack((s) => s.slice(0, -1));
  };

  const handleValidate = () => {
    if (selectedMonster) {
      onMonsterSelected(selectedMonster);
    }
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
          {/* Partie gauche : Recherche et résultats */}
          <div
            className={`flex flex-col gap-4 w-full lg:w-1/4 min-h-0 lg:min-h-full ${showMobileDetails ? "hidden lg:flex" : "flex"}`}>
            {/* Barre de recherche et filtres */}
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

            {/* Légende des icônes */}
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
                      (item) => CodexService.getMonsterTranslation(item, selectedLang) !== null,
                    ).length;
                  } else {
                    visibleCount = searchResults.reduce(
                      (count, item) =>
                        count + codexMonsterLangsVisibleInAllLanguagesSearch(item, searchQuery).length,
                      0,
                    );
                  }

                  if (visibleCount === 0) {
                    return <div className="text-center py-8 text-sm text-muted-foreground">{tDialog("noResults")}</div>;
                  }

                  return (
                    <React.Fragment>
                      <div className="flex flex-col gap-2">
                        {searchResults.flatMap((monsterItem) => {
                          if (selectedLang && !monsterItem.languages.includes(selectedLang)) {
                            return [];
                          }

                          if (selectedLang) {
                            return [
                              <MonsterResultItem
                                key={`${monsterItem._id}-${selectedLang}`}
                                monsterItem={monsterItem}
                                selectedLang={selectedLang}
                                isSelected={selectedMonsterKey === `${monsterItem._id}:${selectedLang}`}
                                onMonsterClick={handleMonsterClick}
                                tDialog={tDialog as (key: string, values?: Record<string, unknown>) => string}
                              />,
                            ];
                          }

                          return codexMonsterLangsVisibleInAllLanguagesSearch(monsterItem, searchQuery).map(
                            (lang: string) => (
                              <MonsterResultItem
                                key={`${monsterItem._id}-${lang}`}
                                monsterItem={monsterItem}
                                selectedLang={selectedLang}
                                pinnedLang={lang}
                                isSelected={selectedMonsterKey === `${monsterItem._id}:${lang}`}
                                onMonsterClick={handleMonsterClick}
                                tDialog={tDialog as (key: string, values?: Record<string, unknown>) => string}
                              />
                            ),
                          );
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

          {/* Partie droite : Affichage du monstre sélectionné */}
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
            {selectedMonster && selectedCodexMonster && selectedMonsterKey ? (
              <div className="flex flex-col flex-1 min-h-0 pr-0 lg:pr-2 overflow-visible lg:overflow-hidden">
                {(() => {
                  const colon = selectedMonsterKey.lastIndexOf(":");
                  const previewLang = colon >= 0 ? selectedMonsterKey.slice(colon + 1) : userLocale;
                  const langs = codexDeclaredPreviewLangs(selectedCodexMonster.languages);
                  return (
                    <>
                      <CodexPreviewLanguageBar
                        availableLangs={langs}
                        currentLang={previewLang}
                        disabled={previewLangResolving}
                        onSelectLang={(l) =>
                          handleMonsterClick(selectedCodexMonster, l, { fromPreviewLangBar: true })
                        }
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
                {tDialog("selectMonster")}
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
