"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spell } from "@/types/character";
import { useTranslations } from "next-intl";
import CodexService from "@/services/CodexService";
import SpellDisplay from "./SpellDisplay";
import { Search, Loader2, BadgeCheck, FileBadge } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CodexSpellSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSpellSelected: (spell: Partial<Spell>) => void;
    accentColor: string;
}

export default function CodexSpellSearchDialog({
    open,
    onOpenChange,
    onSpellSelected,
    accentColor,
}: CodexSpellSearchDialogProps) {
    const tMagic = useTranslations("characterDetail.magic");
    const tDialog = useTranslations("characterDetail.magic.codexDialog");

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLang, setSelectedLang] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedSpell, setSelectedSpell] = useState<Partial<Spell> | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const isLoadingRef = useRef(false);

    const ITEMS_PER_PAGE = 20;

    // Recherche avec debounce
    const searchSpells = useCallback(async (query: string, page: number = 1, append: boolean = false) => {
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
            const response = await CodexService.searchSpells(query, selectedLang, page, ITEMS_PER_PAGE);
            const newResults = response.data || [];

            // Vérifier si on a atteint la fin en comparant le nombre d'éléments reçus
            const reachedEnd = newResults.length < ITEMS_PER_PAGE;

            // Mettre à jour les résultats en utilisant la forme fonctionnelle
            setSearchResults(prev => {
                if (append) {
                    // Éviter les doublons en vérifiant les _id
                    const existingIds = new Set(prev.map(item => item._id));
                    const uniqueNewResults = newResults.filter(item => !existingIds.has(item._id));
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
    }, [selectedLang, tDialog, ITEMS_PER_PAGE]);

    // Effet pour lancer la recherche avec debounce
    useEffect(() => {
        setCurrentPage(1);
        const timer = setTimeout(() => {
            searchSpells(searchQuery, 1, false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedLang, searchSpells]);

    // Réinitialiser lors de l'ouverture du dialog
    useEffect(() => {
        if (open) {
            setSearchQuery("");
            setSelectedLang(null);
            setSearchResults([]);
            setSelectedSpell(null);
            setError(null);
            setCurrentPage(1);
            setHasMore(false);
            isLoadingRef.current = false;
            // Charger les données initiales
            searchSpells("", 1, false);
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

    const handleSpellClick = (codexSpellItem: any) => {
        // Si une langue est sélectionnée, utiliser cette langue, sinon utiliser la première disponible
        const langToUse = selectedLang || codexSpellItem.languages[0];
        const convertedSpell = CodexService.convertToChariotSpell(codexSpellItem, langToUse);
        setSelectedSpell(convertedSpell);
    };

    const handleValidate = () => {
        if (selectedSpell) {
            onSpellSelected(selectedSpell);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-3/5 h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <DialogTitle className="text-2xl">{tDialog("title")}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4 p-6">
                    {/* Partie gauche : Recherche et résultats */}
                    <div className="flex flex-col gap-4 w-full lg:w-1/2 overflow-hidden">
                        {/* Barre de recherche et filtre de langue */}
                        <div className="flex gap-2">
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
                                }}
                            >
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
                                <div className="text-center py-8 text-sm text-red-500">
                                    {error}
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    {searchQuery ? tDialog("noResults") : tDialog("searchPlaceholder")}
                                </div>
                            ) : (() => {
                                // Calculer le nombre de résultats visibles
                                let visibleCount = 0;
                                if (selectedLang) {
                                    visibleCount = searchResults.filter(item =>
                                        CodexService.getSpellTranslation(item, selectedLang) !== null
                                    ).length;
                                } else {
                                    visibleCount = searchResults.reduce((count, item) =>
                                        count + item.languages.filter((lang: string) => item.translations[lang]).length
                                        , 0);
                                }

                                if (visibleCount === 0) {
                                    return (
                                        <div className="text-center py-8 text-sm text-muted-foreground">
                                            {tDialog("noResults")}
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        <div className="flex flex-col gap-2">
                                            {searchResults.map((spellItem) => {
                                                // Si une langue est sélectionnée, afficher cette langue uniquement
                                                if (selectedLang) {
                                                    const translation = CodexService.getSpellTranslation(spellItem, selectedLang);
                                                    if (!translation) return null;

                                                    const isSelected = selectedSpell?.name === translation.name;

                                                    return (
                                                        <Card
                                                            key={`${spellItem._id}-${selectedLang}`}
                                                            onClick={() => handleSpellClick(spellItem)}
                                                            className={`cursor-pointer p-3 hover:border-${accentColor} transition-all ${isSelected ? `border-${accentColor} border-2` : ""
                                                                }`}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1">
                                                                    <div className="font-semibold text-sm md:text-base">
                                                                        {translation.name}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground mt-1">
                                                                        {tMagic("spellLevel", { level: translation.level })} • {translation.school}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1.5 shrink-0">
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
                                                        </Card>
                                                    );
                                                } else {
                                                    // Aucune langue sélectionnée : afficher toutes les traductions disponibles
                                                    return spellItem.languages.map((lang: string) => {
                                                        const translation = spellItem.translations[lang];
                                                        if (!translation) return null;

                                                        const isSelected = selectedSpell?.name === translation.name;
                                                        const langEmoji = lang === 'fr' ? '🇫🇷' : lang === 'en' ? '🇬🇧' : '🇪🇸';

                                                        return (
                                                            <Card
                                                                key={`${spellItem._id}-${lang}`}
                                                                onClick={() => handleSpellClick(spellItem)}
                                                                className={`cursor-pointer p-3 hover:border-${accentColor} transition-all ${isSelected ? `border-${accentColor} border-2` : ""
                                                                    }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-base">{langEmoji}</span>
                                                                            <div className="font-semibold text-sm md:text-base">
                                                                                {translation.name}
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground mt-1">
                                                                            {tMagic("spellLevel", { level: translation.level })} • {translation.school}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-1.5 shrink-0">
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
                                                    className="w-full"
                                                >
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
                                                    more: hasMore ? tDialog("resultsMore") : ""
                                                })}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Partie droite : Affichage du sort sélectionné */}
                    <div className="flex flex-col w-full lg:w-1/2 overflow-hidden border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-4">
                        {selectedSpell ? (
                            <>
                                <h3 className={`text-xl font-semibold mb-4 ${accentColor}`}>
                                    {selectedSpell.name}
                                </h3>
                                <SpellDisplay
                                    spell={selectedSpell as Spell}
                                    accentColor={accentColor}
                                    showTitle={false}
                                />
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                {tDialog("selectSpell")}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="px-6 pb-6 pt-4 border-t shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {tDialog("cancel")}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleValidate}
                        disabled={!selectedSpell}
                    >
                        {tDialog("validate")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
