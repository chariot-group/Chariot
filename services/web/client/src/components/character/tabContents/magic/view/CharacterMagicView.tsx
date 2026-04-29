"use client";

import { AccordionTrigger, Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Character, NPC, Player, Spell, Spellcasting } from "@/types/character";
import { Book, Dice5, Target, ArrowLeft, ListChevronsDownUp, ListChevronsUpDown, WandSparkles } from "lucide-react";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  classWithSpellPrepared,
  getSpellByLevel,
  hasLevel0Spells,
  numberSpellsPrepare,
  getNpcUsesGroups,
  getSpellsByUses,
  npcUsesKey,
} from "@/utils/magic.utils";
import { isPlayer } from "@/utils/global.utils";
import SpellDisplay from "@/components/character/tabContents/magic/SpellDisplay";
import SpellCastControls from "@/components/character/tabContents/magic/SpellCastControls";

interface CharacterMagicViewProps {
  character: Character;
  accentColor: string;
  /** En lecture seule : permet de consommer un emplacement (session + PATCH) */
  onCharacterUpdate?: (updated: Player | NPC) => void;
}

export default function CharacterMagicView({ character, accentColor, onCharacterUpdate }: CharacterMagicViewProps) {
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

    const isInnate = spellcasting.isInnate ?? false;
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

  const activeSpellcasting =
    character.spellcasting?.find((spellcasting) => spellcasting.className === selectedSpellcasting?.className) ||
    character.spellcasting?.[0] ||
    null;

  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const selectedSpellRef = useRef<HTMLDivElement | null>(null);

  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(() => getInitialSpellForSpellcasting(selectedSpellcasting));

  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>(() =>
    getInitialAccordionValuesForSpellcasting(selectedSpellcasting),
  );

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

    const isInnateSpellcasting = activeSpellcasting?.isInnate ?? false;
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

  if (!character.spellcasting || character.spellcasting.length === 0 || activeSpellcasting === null) {
    return (
      <div
        className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-4 lg:px-0"
        role="region"
        aria-label={tMagic("mainRegion")}>
        <p className="text-center text-muted-foreground py-8">{tMagic("noMagicAbilities")}</p>
      </div>
    );
  }

  const isInnate = activeSpellcasting.isInnate ?? false;
  const allAccordionValues = isInnate
    ? getNpcUsesGroups(activeSpellcasting)
      .filter((uses) => getSpellsByUses(activeSpellcasting, uses).length > 0)
      .map(npcUsesKey)
    : (() => {
      const levels: number[] = [];
      if (hasLevel0Spells(activeSpellcasting)) {
        levels.push(0);
      }
      if (activeSpellcasting.spellSlotsByLevel) {
        Object.keys(activeSpellcasting.spellSlotsByLevel).forEach((l) => {
          const n = Number(l);
          if (!levels.includes(n)) levels.push(n);
        });
      }
      if (activeSpellcasting.spells) {
        activeSpellcasting.spells.forEach((spell) => {
          const n = Number(spell.level);
          if (!levels.includes(n)) levels.push(n);
        });
      }
      levels.sort((a, b) => a - b);
      return levels.map((level) => `level-${level}`);
    })();
  const hasAccordionItems = allAccordionValues.length > 0;

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
                const isSelected = activeSpellcasting?.className === spellcasting.className;
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
            <Card className="gap-3 p-2 md:px-6 flex-row items-center">
              <WandSparkles
                className="shrink-0"
                aria-hidden="true"
              />
              <span
                className="text-sm md:text-base hidden sm:inline"
                aria-label={`${tMagic("spellcastingAbility")} : ${activeSpellcasting?.ability}`}>
                {tMagic("spellcastingAbility")} : <strong>{activeSpellcasting?.ability}</strong>
              </span>
              <span
                className="text-sm sm:hidden"
                aria-label={`${tMagic("attackBonus")}: ${activeSpellcasting?.ability}`}>
                {tMagic("attackShort")} : <strong>{activeSpellcasting?.ability}</strong>
              </span>
            </Card>
            <Card className="gap-3 p-2 md:px-6 flex-row items-center">
              <Dice5
                className="shrink-0"
                aria-hidden="true"
              />
              <span
                className="text-sm md:text-base hidden sm:inline"
                aria-label={`${tMagic("saveDC")}: ${activeSpellcasting?.saveDC}`}>
                {tMagic("saveDC")}: <strong>{activeSpellcasting?.saveDC}</strong>
              </span>
              <span
                className="text-sm sm:hidden"
                aria-label={`${tMagic("saveDC")}: ${activeSpellcasting?.saveDC}`}>
                {tMagic("saveDCShort")}: <strong>{activeSpellcasting?.saveDC}</strong>
              </span>
            </Card>
            {isPlayer(character) && classWithSpellPrepared(activeSpellcasting) && (
              <Card className="gap-3 p-2 md:px-6 flex-row items-center">
                <Book
                  className="shrink-0"
                  aria-hidden="true"
                />
                <span
                  className="text-sm md:text-base hidden sm:inline"
                  aria-label={`${tMagic("preparedSpells")} : ${numberSpellsPrepare(activeSpellcasting, character)}`}>
                  {tMagic("preparedSpells")}: <strong>{numberSpellsPrepare(activeSpellcasting, character)}</strong>
                </span>
                <span
                  className="text-sm sm:hidden"
                  aria-label={`${tMagic("preparedSpells")} : ${numberSpellsPrepare(activeSpellcasting, character)}`}>
                  {tMagic("preparedShort")} : <strong>{numberSpellsPrepare(activeSpellcasting, character)}</strong>
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
                aria-label={`${tMagic("attackBonus")}: ${activeSpellcasting?.attackBonus}`}>
                {tMagic("attackBonus")}: <strong>{activeSpellcasting?.attackBonus}</strong>
              </span>
              <span
                className="text-sm sm:hidden"
                aria-label={`${tMagic("attackBonus")}: ${activeSpellcasting?.attackBonus}`}>
                {tMagic("attackShort")}: <strong>{activeSpellcasting?.attackBonus}</strong>
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
              {activeSpellcasting &&
                (() => {
                  if (isInnate) {
                    // ── Grouped by uses per day ──
                    const usesGroups = getNpcUsesGroups(activeSpellcasting);
                    return (
                      <Accordion
                        type="multiple"
                        value={openAccordionValues}
                        onValueChange={setOpenAccordionValues}
                        className="w-full flex flex-col gap-2">
                        {usesGroups.map((uses) => {
                          const key = npcUsesKey(uses);
                          const spells = getSpellsByUses(activeSpellcasting, uses);

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
                                      className={`${selectedSpell === spell && `border`} hover:border border-${accentColor} gap-3 p-2 md:px-6 flex-col cursor-pointer`}
                                      role="button"
                                      tabIndex={0}
                                      aria-pressed={selectedSpell === spell}
                                      aria-label={`${tMagic("selectSpell")}: ${spell.name}`}>
                                      <span
                                        className={`truncate text-sm md:text-base lg:text-lg ${selectedSpell === spell && "font-bold"}`}>
                                        {spell.name}
                                      </span>
                                      {uses !== null && (
                                        <span className="text-xs text-muted-foreground">
                                          {spell.used ?? 0} / {uses}
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
                  }

                  // ── Grouped by spell level ──
                  const levels: number[] = [];

                  // Add level 0 if cantrips exist
                  if (hasLevel0Spells(activeSpellcasting)) {
                    levels.push(0);
                  }

                  // Add other levels from spellSlotsByLevel
                  if (activeSpellcasting.spellSlotsByLevel) {
                    Object.keys(activeSpellcasting.spellSlotsByLevel).forEach((l) => {
                      const n = Number(l);
                      if (!levels.includes(n)) levels.push(n);
                    });
                  }

                  // Add all levels that have spells (even without slots)
                  if (activeSpellcasting.spells) {
                    activeSpellcasting.spells.forEach((spell) => {
                      const n = Number(spell.level);
                      if (!levels.includes(n)) levels.push(n);
                    });
                  }

                  // Sort levels
                  levels.sort((a, b) => a - b);

                  return (
                    <Accordion
                      type="multiple"
                      value={openAccordionValues}
                      onValueChange={setOpenAccordionValues}
                      className="w-full flex flex-col gap-2">
                      {levels.map((level) => {
                        const spells = getSpellByLevel(activeSpellcasting, level);
                        const slot = activeSpellcasting.spellSlotsByLevel?.[level];

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
                                    onClick={() => handleSpellSelect(spell)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        handleSpellSelect(spell);
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
            type="button"
            onClick={handleBackToList}
            className="lg:hidden flex items-center gap-2 py-3 px-4 text-sm font-medium hover:bg-muted rounded-lg transition-colors shrink-0"
            aria-label={tMagic("backToList")}>
            <ArrowLeft className="w-4 h-4" />
            <span>{tMagic("backToList")}</span>
          </button>
          <SpellDisplay
            spell={selectedSpell}
            accentColor={accentColor}
            attackBonus={isPlayer(character) ? activeSpellcasting?.attackBonus ?? null : null}
            titleEndContent={
              isPlayer(character) && onCharacterUpdate ? (
                <SpellCastControls
                  player={character as Player}
                  spellcasting={activeSpellcasting}
                  selectedSpell={selectedSpell}
                  onCharacterUpdate={(p) => onCharacterUpdate(p)}
                />
              ) : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
