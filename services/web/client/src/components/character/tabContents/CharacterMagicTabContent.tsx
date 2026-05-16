"use client";

import { AccordionTrigger, Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Character, Player, Spell, Spellcasting } from "@/types/character";
import { Book, Dice5, Target, ArrowLeft, ListChevronsDownUp, ListChevronsUpDown } from "lucide-react";
import { useState, useRef, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import {
  classWithSpellPrepared,
  countPreparedSpellsInList,
  getSpellByLevel,
  hasLevel0Spells,
  numberSpellsPrepare,
  getNpcUsesGroups,
  getSpellsByUses,
  getRemainingSpellSlots,
  npcUsesKey,
} from "@/utils/magic.utils";
import { isPlayer } from "@/utils/global.utils";

interface CharacterMagicTabContentProps {
  character: Character;
  accentColor: string;
}

export default function CharacterMagicTabContent({ character, accentColor }: CharacterMagicTabContentProps) {
  const tClass = useTranslations("classes");
  const tMagic = useTranslations("characterDetail.magic");
  const playerCharacter = isPlayer(character) ? (character as Player) : null;

  const [selectedSpellcasting, setSelectedSpellcasting] = useState<Spellcasting | null>(
    character.spellcasting?.[0] || null,
  );

  const getInitialSpellForSpellcasting = (spellcasting: Spellcasting | null): Spell | null => {
    if (!spellcasting || !spellcasting.spells || spellcasting.spells.length === 0) {
      return null;
    }

    const isInnate = spellcasting.isInnate ?? !isPlayer(character);
    if (isInnate) {
      const groups = getNpcUsesGroups(spellcasting);
      const firstGroup = groups[0] ?? null;
      return getSpellsByUses(spellcasting, firstGroup)[0] ?? null;
    }

    const level0Spells = spellcasting.spells.filter((spell) => spell.level === 0);
    if (level0Spells.length > 0) {
      return level0Spells[0];
    }

    const minLevel = Math.min(...spellcasting.spells.map((spell) => spell.level));
    return spellcasting.spells.find((spell) => spell.level === minLevel) || null;
  };

  const getInitialAccordionValuesForSpellcasting = (spellcasting: Spellcasting | null): string[] => {
    if (!spellcasting || !spellcasting.spells || spellcasting.spells.length === 0) {
      return [];
    }

    const isInnate = spellcasting.isInnate ?? false;
    if (isInnate) {
      const groups = getNpcUsesGroups(spellcasting);
      return groups.length > 0 ? [npcUsesKey(groups[0])] : [];
    }

    const minLevel = Math.min(...spellcasting.spells.map((spell) => spell.level));
    return [`level-${minLevel}`];
  };

  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const selectedSpellRef = useRef<HTMLDivElement | null>(null);

  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(() => getInitialSpellForSpellcasting(selectedSpellcasting));

  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>(() =>
    getInitialAccordionValuesForSpellcasting(selectedSpellcasting),
  );
  const spellCardRingStyle = { "--tw-ring-color": `var(--${accentColor})` } as CSSProperties;

  const handleSpellcastingChange = (spellcasting: Spellcasting) => {
    setSelectedSpellcasting(spellcasting);
    setSelectedSpell(getInitialSpellForSpellcasting(spellcasting));
    setOpenAccordionValues(getInitialAccordionValuesForSpellcasting(spellcasting));
  };

  const handleSpellSelect = (spell: Spell) => {
    setSelectedSpell(spell);
    setShowMobileDetails(true);
  };

  const handleBackToList = () => {
    setShowMobileDetails(false);

    if (!selectedSpell) {
      return;
    }

    const isInnateSpellcasting = selectedSpellcasting?.isInnate ?? false;
    const accordionKey = !isInnateSpellcasting
      ? `level-${selectedSpell.level}`
      : npcUsesKey(selectedSpell.usesPerDay ?? null);

    setOpenAccordionValues((currentValues) => {
      if (currentValues.includes(accordionKey)) {
        return currentValues;
      }

      return [...currentValues, accordionKey];
    });

    setTimeout(() => {
      selectedSpellRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 350);
  };

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

  const isInnate = selectedSpellcasting.isInnate ?? !isPlayer(character);
  const allAccordionValues = isInnate
    ? getNpcUsesGroups(selectedSpellcasting)
      .filter((uses) => getSpellsByUses(selectedSpellcasting, uses).length > 0)
      .map(npcUsesKey)
    : (() => {
      const levels: number[] = [];
      if (selectedSpellcasting.spells) {
        selectedSpellcasting.spells.forEach((spell) => {
          const n = Number(spell.level);
          if (!levels.includes(n)) levels.push(n);
        });
      }
      levels.sort((a, b) => a - b);
      return levels.map((level) => `level-${level}`);
    })();
  const hasAccordionItems = allAccordionValues.length > 0;

  const maxPreparedForSheet =
    isPlayer(character) && selectedSpellcasting
      ? numberSpellsPrepare(selectedSpellcasting, character)
      : 0;
  const currentPreparedCount =
    isPlayer(character) && selectedSpellcasting && classWithSpellPrepared(selectedSpellcasting)
      ? countPreparedSpellsInList(selectedSpellcasting.spells ?? [])
      : 0;
  const preparedCapacityReached =
    isPlayer(character) &&
    selectedSpellcasting &&
    classWithSpellPrepared(selectedSpellcasting) &&
    maxPreparedForSheet > 0 &&
    currentPreparedCount >= maxPreparedForSheet;

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
                  const classObj = playerCharacter?.class.find(
                    (cls) => cls.name.toLocaleLowerCase() === spellcasting.className.toLocaleLowerCase(),
                  );
                  className = `${tClass(classObj?.name || "")} ${tMagic("level")} ${classObj?.level}` || "";
                } else {
                  className = spellcasting.className;
                }
                const isSelected = selectedSpellcasting?.className === spellcasting.className;
                return (
                  <Card
                    className={`gap-3 p-4 md:px-6 cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected && `bg-${accentColor}`}`}
                    onClick={() => handleSpellcastingChange(spellcasting)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSpellcastingChange(spellcasting);
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
            {isPlayer(character) && classWithSpellPrepared(selectedSpellcasting) && (
              <>
                {preparedCapacityReached ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="gap-3 p-2 md:px-6 flex-row items-center cursor-default">
                        <Book
                          className="shrink-0"
                          aria-hidden="true"
                        />
                        <span
                          className="text-sm md:text-base hidden sm:inline"
                          aria-label={`${tMagic("preparedSpells")}: ${tMagic("preparedSpellsUsage", { current: currentPreparedCount, max: maxPreparedForSheet })}`}>
                          {tMagic("preparedSpells")}:{" "}
                          <strong>
                            {tMagic("preparedSpellsUsage", {
                              current: currentPreparedCount,
                              max: maxPreparedForSheet,
                            })}
                          </strong>
                        </span>
                        <span
                          className="text-sm sm:hidden"
                          aria-label={`${tMagic("preparedSpells")}: ${tMagic("preparedSpellsUsage", { current: currentPreparedCount, max: maxPreparedForSheet })}`}>
                          {tMagic("preparedShort")}:{" "}
                          <strong>
                            {tMagic("preparedSpellsUsage", {
                              current: currentPreparedCount,
                              max: maxPreparedForSheet,
                            })}
                          </strong>
                        </span>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tMagic("preparedSpellsLimitReachedTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Card className="gap-3 p-2 md:px-6 flex-row items-center">
                    <Book
                      className="shrink-0"
                      aria-hidden="true"
                    />
                    <span
                      className="text-sm md:text-base hidden sm:inline"
                      aria-label={`${tMagic("preparedSpells")}: ${tMagic("preparedSpellsUsage", { current: currentPreparedCount, max: maxPreparedForSheet })}`}>
                      {tMagic("preparedSpells")}:{" "}
                      <strong>
                        {tMagic("preparedSpellsUsage", {
                          current: currentPreparedCount,
                          max: maxPreparedForSheet,
                        })}
                      </strong>
                    </span>
                    <span
                      className="text-sm sm:hidden"
                      aria-label={`${tMagic("preparedSpells")}: ${tMagic("preparedSpellsUsage", { current: currentPreparedCount, max: maxPreparedForSheet })}`}>
                      {tMagic("preparedShort")}:{" "}
                      <strong>
                        {tMagic("preparedSpellsUsage", {
                          current: currentPreparedCount,
                          max: maxPreparedForSheet,
                        })}
                      </strong>
                    </span>
                  </Card>
                )}
              </>
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
          </div>
          <div className="flex flex-col gap-2 flex-1 overflow-hidden">
            <Card className="gap-2 sm:gap-3 p-4 md:px-6 h-fit justify-between flex-row items-center">
              <h2 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>{tMagic("spells")}</h2>
              <div className="flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (!hasAccordionItems) return;
                    const isAllOpen = openAccordionValues.length > 0;
                    setOpenAccordionValues(isAllOpen ? [] : allAccordionValues);
                  }}
                  disabled={!hasAccordionItems}
                  className={`text-sm pr-3 py-2 focus:outline-none ${hasAccordionItems ? "cursor-pointer hover:underline focus:underline" : "cursor-not-allowed opacity-45"} ${accentColor}`}
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
                  if (isInnate) {
                    // ── Grouped by uses per day ──
                    const usesGroups = getNpcUsesGroups(selectedSpellcasting);
                    return (
                      <Accordion
                        type="multiple"
                        value={openAccordionValues}
                        onValueChange={setOpenAccordionValues}
                        className="w-full flex flex-col gap-2">
                        {usesGroups.map((uses) => {
                          const key = npcUsesKey(uses);
                          const spells = getSpellsByUses(selectedSpellcasting, uses);
                          const tracker =
                            uses !== null ? (selectedSpellcasting.spellSlotsByUses?.[`k${uses}`] ?? null) : null;

                          return (
                            <AccordionItem
                              key={key}
                              value={key}
                              className={`flex flex-col gap-2`}>
                              <Card className="gap-3 p-0">
                                <AccordionTrigger className="py-4 px-4 md:px-6">
                                  <div className="flex items-center gap-3">
                                    <h2 className={`text-base md:text-lg font-medium ${accentColor}`}>
                                      {uses === null ? tMagic("npc.atWill") : tMagic("npc.usesPerDay", { count: uses })}
                                    </h2>
                                    {uses !== null && (
                                      <span className="text-sm font-mono px-2 py-0.5 rounded bg-muted border">
                                        {tracker ?? 0} / {uses}
                                      </span>
                                    )}
                                  </div>
                                </AccordionTrigger>
                              </Card>

                              <AccordionContent className="pb-4">
                                <div
                                  className="flex flex-wrap gap-2"
                                  role="list">
                                  {spells.map((spell, index) => (
                                    <Card
                                      ref={selectedSpell === spell ? selectedSpellRef : null}
                                      onClick={() => handleSpellSelect(spell)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          handleSpellSelect(spell);
                                        }
                                      }}
                                      key={index}
                                      className={`${selectedSpell === spell ? "ring-2" : ""} hover:ring-2 ring-inset transition-shadow gap-3 p-2 md:px-6 flex-col cursor-pointer`}
                                      style={spellCardRingStyle}
                                      role="button"
                                      tabIndex={0}
                                      aria-pressed={selectedSpell === spell}
                                      aria-label={`${tMagic("selectSpell")}: ${spell.name}`}>
                                      <span
                                        className={`truncate text-sm md:text-base lg:text-lg ${selectedSpell === spell && "font-bold"}`}>
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
                  }

                  // ── Grouped by spell level ──
                  const levels: number[] = [];

                  if (hasLevel0Spells(selectedSpellcasting)) {
                    levels.push(0);
                  }

                  if (selectedSpellcasting.spellSlotsByLevel) {
                    Object.keys(selectedSpellcasting.spellSlotsByLevel).forEach((l) => {
                      const n = Number(l);
                      if (!levels.includes(n)) levels.push(n);
                    });
                  }

                  if (selectedSpellcasting.spells) {
                    selectedSpellcasting.spells.forEach((spell) => {
                      const n = Number(spell.level);
                      if (!levels.includes(n)) levels.push(n);
                    });
                  }

                  levels.sort((a, b) => a - b);

                  return (
                    <Accordion
                      type="multiple"
                      value={openAccordionValues}
                      onValueChange={setOpenAccordionValues}
                      className="w-full flex flex-col gap-2">
                      {levels.map((level) => {
                        const spells = getSpellByLevel(selectedSpellcasting, level);
                        const slotCount = level > 0 ? getRemainingSpellSlots(selectedSpellcasting, level) : null;

                        return (
                          <AccordionItem
                            key={level}
                            value={`level-${level}`}
                            className={`flex flex-col gap-2`}>
                            <Card className="gap-3 p-0">
                              <AccordionTrigger className="py-4 px-4 md:px-6">
                                <h2 className={`text-base md:text-lg font-medium ${accentColor}`}>
                                  {level === 0
                                    ? `${tMagic("cantrips")}: ∞`
                                    : `${tMagic("spellLevel", { level })}: ${tMagic("spellSlots", { current: slotCount?.current || 0, total: slotCount?.total || 0 })}`}
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
                                    onClick={() => handleSpellSelect(spell)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        handleSpellSelect(spell);
                                      }
                                    }}
                                    key={index}
                                    className={`${selectedSpell === spell ? "ring-2" : ""} hover:ring-2 ring-inset transition-shadow gap-3 p-2 md:px-6 flex-col cursor-pointer`}
                                    style={spellCardRingStyle}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={selectedSpell === spell}
                                    aria-label={`${tMagic("selectSpell")}: ${spell.name}`}>
                                    <span
                                      className={`truncate text-sm md:text-base lg:text-lg ${selectedSpell === spell && "font-bold"} `}>
                                      {spell.name}
                                    </span>
                                    {isPlayer(character) &&
                                      classWithSpellPrepared(selectedSpellcasting) &&
                                      level > 0 &&
                                      spell.prepared !== true && (
                                        <span className="text-xs text-amber-600/90 font-medium">
                                          {tMagic("spellUnpreparedBadge")}
                                        </span>
                                      )}
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
            type="button"
            onClick={handleBackToList}
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
              {/* Level — NPC only */}
              {!isPlayer(character) && selectedSpell?.level != null && (
                <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                  <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                    {tMagic("spellDetails.level")}:
                  </span>
                  <span className="text-sm md:text-base wrap-break-word">
                    {selectedSpell.level === 0
                      ? tMagic("cantrips")
                      : tMagic("spellLevel", { level: selectedSpell.level })}
                  </span>
                </Card>
              )}
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
