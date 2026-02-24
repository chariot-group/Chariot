"use client";

import { AccordionTrigger, Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Character, Spell, Spellcasting } from "@/types/character";
import { Book, Dice5, Target, ArrowLeft, ListChevronsDownUp, ListChevronsUpDown, WandSparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { classWithSpellPrepared, getSpellByLevel, hasLevel0Spells, numberSpellsPrepare } from "@/utils/magic.utils";
import { isPlayer } from "@/utils/global.utils";

interface CharacterMagicViewProps {
    character: Character;
    accentColor: string;
}

export default function CharacterMagicView({ character, accentColor }: CharacterMagicViewProps) {
    const tClass = useTranslations("classes");
    const tMagic = useTranslations("characterDetail.magic");

    const [selectedSpellcasting, setSelectedSpellcasting] = useState<Spellcasting | null>(
        character.spellcasting?.[0] || null,
    );

    const [showMobileDetails, setShowMobileDetails] = useState(false);
    const selectedSpellRef = useRef<HTMLDivElement | null>(null);

    const [selectedSpell, setSelectedSpell] = useState<Spell | null>(() => {
        if (!selectedSpellcasting || !selectedSpellcasting.spells || selectedSpellcasting.spells.length === 0) {
            return null;
        }

        // Find the first level 0 spell
        const level0Spells = selectedSpellcasting.spells.filter((spell) => spell.level === 0);
        if (level0Spells.length > 0) {
            return level0Spells[0];
        }

        // Otherwise, find the lowest level and return the first spell of that level
        const minLevel = Math.min(...selectedSpellcasting.spells.map((spell) => spell.level));
        return selectedSpellcasting.spells.find((spell) => spell.level === minLevel) || null;
    });

    const [openAccordionValues, setOpenAccordionValues] = useState<string[]>(() => {
        if (!selectedSpellcasting || !selectedSpellcasting.spells || selectedSpellcasting.spells.length === 0) {
            return [];
        }

        // Find the lowest level and open its accordion
        const minLevel = Math.min(...selectedSpellcasting.spells.map((spell) => spell.level));
        return [`level-${minLevel}`];
    });

    useEffect(() => {
        // When selectedSpellcasting changes, update selectedSpell and open the first spell's accordion
        if (selectedSpellcasting && selectedSpellcasting.spells && selectedSpellcasting.spells.length > 0) {
            const minLevel = Math.min(...selectedSpellcasting.spells.map((spell) => spell.level));
            const firstSpell = selectedSpellcasting.spells.find((spell) => spell.level === minLevel) || null;
            setSelectedSpell(firstSpell);
            setOpenAccordionValues([`level-${minLevel}`]);
        }
    }, [selectedSpellcasting]);

    useEffect(() => {
        if (!showMobileDetails && selectedSpell && selectedSpellRef.current) {
            // Open the accordion containing the selected spell
            const spellLevel = `level-${selectedSpell.level}`;
            if (!openAccordionValues.includes(spellLevel)) {
                setOpenAccordionValues([...openAccordionValues, spellLevel]);
            }

            // Wait for accordion animation to complete before scrolling
            setTimeout(() => {
                selectedSpellRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }, 350);
        }
    }, [showMobileDetails]);

    if (!character.spellcasting || character.spellcasting.length === 0 || selectedSpellcasting === null) {
        return (
            <div
                className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-4 lg:px-0"
                role="region"
                aria-label={tMagic("mainRegion")}>
                <p className="text-center text-muted-foreground py-8">{tMagic("noMagicAbilities")}</p>
            </div>
        );
    }

    return (
        <div
            className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-4 lg:px-0 max-h-[calc(100vh-20rem)] relative"
            role="region"
            aria-label={tMagic("mainRegion")}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-4 h-full overflow-hidden">
                {/* Left column: Spell list (hidden on mobile when showing details) */}
                <div
                    className={`flex flex-col gap-2 md:gap-4 h-full overflow-hidden ${showMobileDetails ? "hidden lg:flex" : "flex"}`}>
                    {character?.spellcasting?.length > 1 && (
                        <nav
                            className="flex flex-wrap sm:flex-row gap-2 shrink-0"
                            aria-label={tMagic("spellcastingClass")}>
                            {character?.spellcasting?.map((spellcasting, index) => {
                                let className = "";
                                if (isPlayer(character)) {
                                    let classObj = (character as any).class.find(
                                        (cls: any) => cls.name.toLocaleLowerCase() === spellcasting.className.toLocaleLowerCase(),
                                    );
                                    className = `${tClass(classObj?.name || "")} ${tMagic("level")} ${classObj?.level}` || "";
                                } else {
                                    className = spellcasting.className;
                                }
                                const isSelected = selectedSpellcasting?.className === spellcasting.className;
                                return (
                                    <Card
                                        className={`gap-3 p-4 md:px-6 cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected && `bg-${accentColor}`}`}
                                        onClick={() => setSelectedSpellcasting(spellcasting)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setSelectedSpellcasting(spellcasting);
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={isSelected}
                                        aria-label={tMagic("selectSpellcasting", { className })}
                                        key={index}>
                                        <h2 className={`${isSelected ? `text-black` : `${accentColor}`} text-sm md:text-2xl font-semibold`}>
                                            {className}
                                        </h2>
                                    </Card>
                                );
                            })}
                        </nav>
                    )}
                    <div
                        className="flex flex-wrap gap-2 shrink-0"
                        role="group"
                        aria-label={tMagic("spellcastingStats")}>
                        <Card className="gap-3 p-2 md:px-6 flex-row items-center">
                            <WandSparkles
                                className="shrink-0"
                                aria-hidden="true"
                            />
                            <span
                                className="text-sm md:text-base hidden sm:inline"
                                aria-label={`${tMagic("spellcastingAbility")} : ${selectedSpellcasting?.ability}`}>
                                {tMagic("spellcastingAbility")} : <strong>{selectedSpellcasting?.ability}</strong>
                            </span>
                            <span
                                className="text-sm sm:hidden"
                                aria-label={`${tMagic("attackBonus")}: ${selectedSpellcasting?.ability}`}>
                                {tMagic("attackShort")} : <strong>{selectedSpellcasting?.ability}</strong>
                            </span>
                        </Card>
                        <Card className="gap-3 p-2 md:px-6 flex-row items-center">
                            <Dice5
                                className="shrink-0"
                                aria-hidden="true"
                            />
                            <span
                                className="text-sm md:text-base hidden sm:inline"
                                aria-label={`${tMagic("saveDC")}: ${selectedSpellcasting?.saveDC}`}>
                                {tMagic("saveDC")}: <strong>{selectedSpellcasting?.saveDC}</strong>
                            </span>
                            <span
                                className="text-sm sm:hidden"
                                aria-label={`${tMagic("saveDC")}: ${selectedSpellcasting?.saveDC}`}>
                                {tMagic("saveDCShort")}: <strong>{selectedSpellcasting?.saveDC}</strong>
                            </span>
                        </Card>
                        {isPlayer(character) && classWithSpellPrepared(selectedSpellcasting) && (
                            <Card className="gap-3 p-2 md:px-6 flex-row items-center">
                                <Book
                                    className="shrink-0"
                                    aria-hidden="true"
                                />
                                <span
                                    className="text-sm md:text-base hidden sm:inline"
                                    aria-label={`${tMagic("preparedSpells")} : ${numberSpellsPrepare(selectedSpellcasting, character)}`}>
                                    {tMagic("preparedSpells")}: <strong>{numberSpellsPrepare(selectedSpellcasting, character)}</strong>
                                </span>
                                <span
                                    className="text-sm sm:hidden"
                                    aria-label={`${tMagic("preparedSpells")} : ${numberSpellsPrepare(selectedSpellcasting, character)}`}>
                                    {tMagic("preparedShort")} : <strong>{numberSpellsPrepare(selectedSpellcasting, character)}</strong>
                                </span>
                            </Card>
                        )}
                        <Card className="gap-3 p-2 md:px-6 flex-row items-center">
                            <Target
                                className="shrink-0"
                                aria-hidden="true"
                            />
                            <span
                                className="text-sm md:text-base hidden sm:inline"
                                aria-label={`${tMagic("attackBonus")}: ${selectedSpellcasting?.attackBonus}`}>
                                {tMagic("attackBonus")}: <strong>{selectedSpellcasting?.attackBonus}</strong>
                            </span>
                            <span
                                className="text-sm sm:hidden"
                                aria-label={`${tMagic("attackBonus")}: ${selectedSpellcasting?.attackBonus}`}>
                                {tMagic("attackShort")}: <strong>{selectedSpellcasting?.attackBonus}</strong>
                            </span>
                        </Card>
                    </div>
                    <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                        <Card className="gap-2 sm:gap-3 p-4 md:px-6 h-fit justify-between flex-row items-center">
                            <h2 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>{tMagic("spells")}</h2>
                            <div className="flex justify-end shrink-0">
                                <button
                                    onClick={() => {
                                        const levels: number[] = [];
                                        if (hasLevel0Spells(selectedSpellcasting)) {
                                            levels.push(0);
                                        }
                                        if (selectedSpellcasting.spellSlotsByLevel) {
                                            levels.push(...Object.keys(selectedSpellcasting.spellSlotsByLevel).map(Number));
                                        }

                                        const allLevelValues = levels.map((level) => `level-${level}`);
                                        const isAllOpen = openAccordionValues.length > 0;

                                        setOpenAccordionValues(isAllOpen ? [] : allLevelValues);
                                    }}
                                    className={`cursor-pointer text-sm pr-3 py-2 hover:underline focus:outline-none focus:underline ${accentColor}`}
                                    aria-label={openAccordionValues.length > 0 ? tMagic("collapseAll") : tMagic("expandAll")}
                                    aria-expanded={openAccordionValues.length > 0}>
                                    {openAccordionValues.length > 0 ? <ListChevronsDownUp /> : <ListChevronsUpDown />}
                                </button>
                            </div>
                        </Card>

                        <nav
                            className="flex flex-col gap-2 sm:gap-3 flex-1 overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full"
                            role="navigation"
                            aria-label={tMagic("spellListRegion")}
                            aria-live="polite"
                            aria-atomic="false">
                            {selectedSpellcasting &&
                                (() => {
                                    // Build array of all spell levels to display
                                    const levels: number[] = [];

                                    // Add level 0 if cantrips exist
                                    if (hasLevel0Spells(selectedSpellcasting)) {
                                        levels.push(0);
                                    }

                                    // Add other levels from spellSlotsByLevel
                                    if (selectedSpellcasting.spellSlotsByLevel) {
                                        levels.push(...Object.keys(selectedSpellcasting.spellSlotsByLevel).map(Number));
                                    }

                                    return (
                                        <Accordion
                                            type="multiple"
                                            value={openAccordionValues}
                                            onValueChange={setOpenAccordionValues}
                                            className="w-full flex flex-col gap-2">
                                            {levels.map((level) => {
                                                const spells = getSpellByLevel(selectedSpellcasting, level);
                                                const slot = selectedSpellcasting.spellSlotsByLevel?.[level];

                                                return (
                                                    <AccordionItem
                                                        key={level}
                                                        value={`level-${level}`}
                                                        className={`flex flex-col gap-2`}>
                                                        <Card className="gap-3 p-0">
                                                            <AccordionTrigger className="py-4 px-4 md:px-6">
                                                                <h2 className={`text-base md:text-lg font-medium ${accentColor}`}>
                                                                    {level === 0
                                                                        ? tMagic("cantrips")
                                                                        : `${tMagic("spellLevel", { level })}: ${tMagic("spellSlots", { used: slot?.used || 0, total: slot?.total || 0 })}`}
                                                                </h2>
                                                            </AccordionTrigger>
                                                        </Card>

                                                        <AccordionContent className="pb-4">
                                                            <div
                                                                className="flex flex-wrap gap-2"
                                                                role="list">
                                                                {spells.map((spell, index) => (
                                                                    <Card
                                                                        ref={selectedSpell === spell ? selectedSpellRef : null}
                                                                        onClick={() => {
                                                                            setSelectedSpell(spell);
                                                                            setShowMobileDetails(true);
                                                                        }}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter" || e.key === " ") {
                                                                                e.preventDefault();
                                                                                setSelectedSpell(spell);
                                                                                setShowMobileDetails(true);
                                                                            }
                                                                        }}
                                                                        key={index}
                                                                        className={`${selectedSpell === spell && `border`} hover:border border-${accentColor} gap-3 p-2 md:px-6 flex-col cursor-pointer`}
                                                                        role="button"
                                                                        tabIndex={0}
                                                                        aria-pressed={selectedSpell === spell}
                                                                        aria-label={`${tMagic("selectSpell")}: ${spell.name}`}>
                                                                        <span
                                                                            className={`truncate text-sm md:text-base lg:text-lg ${selectedSpell === spell && "font-bold"} `}>
                                                                            {spell.name}
                                                                        </span>
                                                                    </Card>
                                                                ))}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                );
                                            })}
                                        </Accordion>
                                    );
                                })()}
                        </nav>
                    </div>
                </div>
                {/* Right column: Spell details (visible on mobile when showMobileDetails is true, always visible on desktop) */}
                <div
                    className={`flex flex-col gap-2 h-full overflow-hidden ${showMobileDetails ? "flex" : "hidden lg:flex"}`}
                    role="region"
                    aria-label={tMagic("spellDetailRegion")}>
                    {/* Back button for mobile */}
                    <button
                        onClick={() => setShowMobileDetails(false)}
                        className="lg:hidden flex items-center gap-2 py-3 px-4 text-sm font-medium hover:bg-muted rounded-lg transition-colors shrink-0"
                        aria-label={tMagic("backToList")}>
                        <ArrowLeft className="w-4 h-4" />
                        <span>{tMagic("backToList")}</span>
                    </button>
                    <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <Card className="gap-3 py-4 px-4 md:px-6 flex-col">
                            <h3
                                className={`${accentColor} text-lg sm:text-xl md:text-2xl font-semibold`}
                                id="spell-name">
                                {selectedSpell?.name}
                            </h3>
                        </Card>
                        <div className="flex flex-wrap gap-2 items-start">
                            <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                                <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                                    {tMagic("spellDetails.school")}:
                                </span>
                                <span className="text-sm md:text-base wrap-break-word">{selectedSpell?.school}</span>
                            </Card>
                            <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                                <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                                    {tMagic("spellDetails.castingTime")}:
                                </span>
                                <span className="text-sm md:text-base wrap-break-word">{selectedSpell?.castingTime}</span>
                            </Card>
                            <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                                <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                                    {tMagic("spellDetails.range")}:
                                </span>
                                <span className="text-sm md:text-base wrap-break-word">{selectedSpell?.range}</span>
                            </Card>
                            <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                                <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                                    {tMagic("spellDetails.components")}:
                                </span>
                                <span className="text-sm md:text-base wrap-break-word">{selectedSpell?.components?.join(", ")}</span>
                            </Card>
                            <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                                <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                                    {tMagic("spellDetails.duration")}:
                                </span>
                                <span className="text-sm md:text-base wrap-break-word">{selectedSpell?.duration}</span>
                            </Card>
                            <Card className="flex flex-col gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
                                <span className={`${accentColor} font-semibold text-sm md:text-base`}>
                                    {tMagic("spellDetails.description")}:
                                </span>
                                <span className="text-sm md:text-base leading-relaxed">{selectedSpell?.description}</span>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
