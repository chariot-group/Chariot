"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NPC } from "@/types/character";
import { useTranslations } from "next-intl";
import CodexService from "@/services/CodexService";
import { Search, Loader2, BadgeCheck, FileBadge, ArrowLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import MonsterPreview from "@/components/character/MonsterPreview";
import { formatChallengeRating } from "@/utils/challengeRating.utils";

interface MonsterCodexDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMonsterSelected: (monster: Partial<NPC>) => void;
}

export default function MonsterCodexDialog({ open, onOpenChange, onMonsterSelected }: MonsterCodexDialogProps) {
  const tDialog = useTranslations("characterDetail.magic.monsterCodexDialog");
  const tMagic = useTranslations("characterDetail.magic");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMonster, setSelectedMonster] = useState<Partial<NPC> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const isLoadingRef = useRef(false);

  const ITEMS_PER_PAGE = 20;

  // Recherche avec debounce
  const searchMonsters = useCallback(
    async (query: string, page: number = 1, append: boolean = false) => {
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
        const response = await CodexService.searchMonsters(query, selectedLang, page, ITEMS_PER_PAGE);
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
    [selectedLang, tDialog, ITEMS_PER_PAGE],
  );

  // Effet pour lancer la recherche avec debounce
  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      searchMonsters(searchQuery, 1, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedLang, searchMonsters]);

  // Réinitialiser lors de l'ouverture du dialog
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setSelectedLang(null);
      setSearchResults([]);
      setSelectedMonster(null);
      setShowMobileDetails(false);
      setError(null);
      setCurrentPage(1);
      setHasMore(false);
      isLoadingRef.current = false;
      // Charger les données initiales
      searchMonsters("", 1, false);
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

  const handleMonsterClick = (codexMonsterItem: any) => {
    // Si une langue est sélectionnée, utiliser cette langue, sinon utiliser la première disponible
    const langToUse = selectedLang || codexMonsterItem.languages[0];
    const convertedMonster = CodexService.convertToChariotNPC(codexMonsterItem, langToUse);
    setSelectedMonster(convertedMonster);
    setShowMobileDetails(true);
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
            className={`flex flex-col gap-4 w-full lg:w-1/4 overflow-hidden min-h-0 lg:min-h-full ${showMobileDetails ? "hidden lg:flex" : "flex"}`}>
            {/* Barre de recherche et filtre de langue */}
            <div className="flex flex-col md:flex-row lg:flex-col gap-2 w-full">
              <div className="relative flex-1">
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
                <SelectTrigger className="w-45">
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
                      (count, item) => count + item.languages.filter((lang: string) => item.translations[lang]).length,
                      0,
                    );
                  }

                  if (visibleCount === 0) {
                    return <div className="text-center py-8 text-sm text-muted-foreground">{tDialog("noResults")}</div>;
                  }

                  return (
                    <>
                      <div className="flex flex-col gap-2">
                        {searchResults.map((monsterItem) => {
                          // Si une langue est sélectionnée, afficher cette langue uniquement
                          if (selectedLang) {
                            const translation = CodexService.getMonsterTranslation(monsterItem, selectedLang);
                            if (!translation) return null;

                            const isSelected = selectedMonster?.firstname === translation.firstname;

                            return (
                              <Card
                                key={`${monsterItem._id}-${selectedLang}`}
                                onClick={() => handleMonsterClick(monsterItem)}
                                className={`cursor-pointer p-3 hover:border-purple transition-all ${
                                  isSelected ? "border-purple border-2" : ""
                                }`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="font-semibold text-sm md:text-base">{translation.firstname}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {tDialog("monsterInfo", {
                                        cr: formatChallengeRating(translation.challenge.challengeRating),
                                        type: translation.profile.type,
                                      })}
                                    </div>
                                  </div>
                                  <div className="flex gap-1.5 shrink-0">
                                    {monsterItem.tag === 1 && (
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
                              </Card>
                            );
                          } else {
                            // Aucune langue sélectionnée : afficher toutes les traductions disponibles
                            return monsterItem.languages.map((lang: string) => {
                              const translation = monsterItem.translations[lang];
                              if (!translation) return null;

                              const isSelected = selectedMonster?.firstname === translation.firstname;
                              const langEmoji = lang === "fr" ? "🇫🇷" : lang === "en" ? "🇬🇧" : "🇪🇸";

                              return (
                                <Card
                                  key={`${monsterItem._id}-${lang}`}
                                  onClick={() => handleMonsterClick(monsterItem)}
                                  className={`cursor-pointer p-3 hover:border-purple transition-all ${
                                    isSelected ? "border-purple border-2" : ""
                                  }`}>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-base">{langEmoji}</span>
                                        <div className="font-semibold text-sm md:text-base">
                                          {translation.firstname}
                                        </div>
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {tDialog("monsterInfo", {
                                          cr: formatChallengeRating(translation.challenge.challengeRating),
                                          type: translation.profile.type,
                                        })}
                                      </div>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                      {monsterItem.tag === 1 && (
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
                                </Card>
                              );
                            });
                          }
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
                    </>
                  );
                })()
              )}
            </div>
          </div>

          {/* Partie droite : Affichage du monstre sélectionné */}
          <div
            className={`flex-col w-full lg:w-3/4 overflow-y-auto lg:overflow-hidden min-h-[45vh] lg:min-h-0 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-4 ${showMobileDetails ? "flex" : "hidden lg:flex"}`}>
            <Button
              type="button"
              variant="ghost"
              className="lg:hidden self-start mb-2 px-2"
              onClick={() => setShowMobileDetails(false)}
              aria-label={tMagic("backToList")}>
              <ArrowLeft className="size-4 mr-2" />
              {tMagic("backToList")}
            </Button>
            {selectedMonster ? (
              <div className="h-full min-h-0 pr-0 lg:pr-2 overflow-visible lg:overflow-hidden">
                <MonsterPreview monster={selectedMonster} />
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
