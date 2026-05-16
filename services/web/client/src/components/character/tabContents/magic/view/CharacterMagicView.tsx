"use client";

import { AccordionTrigger, Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Character, NPC, Player, Spell, Spellcasting } from "@/types/character";
import {
  Book,
  Dice5,
  Target,
  ArrowLeft,
  ListChevronsDownUp,
  ListChevronsUpDown,
  WandSparkles,
  BookOpen,
  BookOpenCheck,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  classWithSpellPrepared,
  countPreparedSpellsInList,
  findSpellIndexInList,
  getSpellByLevel,
  hasLevel0Spells,
  numberSpellsPrepare,
  getNpcUsesGroups,
  getSpellsByUses,
  npcUsesKey,
  sortSpellsPreparedFirst,
} from "@/utils/magic.utils";
import { isPlayer } from "@/utils/global.utils";
import SpellDisplay from "@/components/character/tabContents/magic/SpellDisplay";
import SpellCastControls from "@/components/character/tabContents/magic/SpellCastControls";
import SpellPreparedPill from "@/components/character/tabContents/magic/SpellPreparedPill";
import { Button } from "@/components/ui/button";
import CharacterService from "@/services/CharacterService";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

interface CharacterMagicViewProps {
  character: Character;
  accentColor: string;
  /** En lecture seule : permet de consommer un emplacement (session + PATCH) */
  onCharacterUpdate?: (updated: Player | NPC) => void;
}

export default function CharacterMagicView({ character, accentColor, onCharacterUpdate }: CharacterMagicViewProps) {
  const tClass = useTranslations("classes");
  const tMagic = useTranslations("characterDetail.magic");
  const toast = useToast();
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

  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(() =>
    getInitialSpellForSpellcasting(selectedSpellcasting),
  );

  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>(() =>
    getInitialAccordionValuesForSpellcasting(selectedSpellcasting),
  );

  const [preparationEditMode, setPreparationEditMode] = useState(false);
  const [prepSavingKey, setPrepSavingKey] = useState<string | null>(null);

  const handleSpellcastingChange = (spellcasting: Spellcasting) => {
    setSelectedSpellcasting(spellcasting);
    setSelectedSpell(getInitialSpellForSpellcasting(spellcasting));
    setOpenAccordionValues(getInitialAccordionValuesForSpellcasting(spellcasting));
    setPreparationEditMode(false);
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

  const toggleSpellPreparedRemote = useCallback(
    async (spell: Spell, spellLevel: number) => {
      if (
        !onCharacterUpdate ||
        !isPlayer(character) ||
        !activeSpellcasting ||
        spellLevel <= 0 ||
        activeSpellcasting.isInnate ||
        !classWithSpellPrepared(activeSpellcasting)
      ) {
        return;
      }

      const spells = activeSpellcasting.spells ?? [];
      const spellIdx = findSpellIndexInList(spells, spell);
      if (spellIdx < 0) return;

      const currentlyPrepared = spell.prepared === true;
      const nextPrepared = !currentlyPrepared;

      if (nextPrepared) {
        const maxPrep = numberSpellsPrepare(activeSpellcasting, character);
        const countExcl = spells.reduce((acc, s, i) => {
          if (i === spellIdx) return acc;
          if (Number(s.level) > 0 && s.prepared === true) return acc + 1;
          return acc;
        }, 0);
        if (maxPrep > 0 && countExcl >= maxPrep) {
          toast.error(tMagic("spellPrepareLimitTooltip"));
          return;
        }
      }

      const key = `prep-${spellIdx}-${spell.level ?? 0}`;
      setPrepSavingKey(key);
      try {
        const list = (character.spellcasting ?? []).map((sc) => {
          if (sc.className.trim().toLowerCase() !== activeSpellcasting.className.trim().toLowerCase()) return sc;
          const idx = findSpellIndexInList(sc.spells, spell);
          if (idx < 0) return sc;
          const nextSpells = [...sc.spells];
          nextSpells[idx] = { ...nextSpells[idx], prepared: nextPrepared };
          return { ...sc, spells: nextSpells };
        });
        const updated = (await CharacterService.updateCharacter("players", (character as Player)._id, {
          spellcasting: list,
        })) as Player;
        const scNew = updated.spellcasting?.find(
          (s) => s.className.trim().toLowerCase() === activeSpellcasting.className.trim().toLowerCase(),
        );
        const idxNew = scNew ? findSpellIndexInList(scNew.spells, spell) : -1;
        if (idxNew >= 0 && scNew) {
          setSelectedSpell(scNew.spells[idxNew]);
        }
        onCharacterUpdate(updated);
      } catch (e) {
        console.error(e);
        toast.error(tMagic("spellCastError"));
      } finally {
        setPrepSavingKey(null);
      }
    },
    [activeSpellcasting, character, onCharacterUpdate, toast, tMagic],
  );

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
  const appliesPrepMechanic = isPlayer(character) && classWithSpellPrepared(activeSpellcasting) && !isInnate;
  const showPreparedSpellsControls = appliesPrepMechanic && Boolean(onCharacterUpdate);
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
            if (!Number.isFinite(n)) return;
            if (!levels.includes(n)) levels.push(n);
          });
        }
        if (activeSpellcasting.spells) {
          activeSpellcasting.spells.forEach((spell) => {
            const n = Number(spell.level);
            if (!Number.isFinite(n)) return;
            if (!levels.includes(n)) levels.push(n);
          });
        }
        levels.sort((a, b) => a - b);
        return levels.map((level) => `level-${level}`);
      })();
  const hasAccordionItems = allAccordionValues.length > 0;

  const maxPreparedForView =
    isPlayer(character) && activeSpellcasting ? numberSpellsPrepare(activeSpellcasting, character) : 0;
  const currentPreparedCountView =
    isPlayer(character) && activeSpellcasting && classWithSpellPrepared(activeSpellcasting)
      ? countPreparedSpellsInList(activeSpellcasting.spells ?? [])
      : 0;
  const preparedCapacityReachedView =
    isPlayer(character) &&
    activeSpellcasting &&
    classWithSpellPrepared(activeSpellcasting) &&
    maxPreparedForView > 0 &&
    currentPreparedCountView >= maxPreparedForView;

  return (
    <div
      className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-4 lg:px-0 min-h-0 max-xl:max-h-none xl:flex-1 xl:min-h-0 xl:h-full xl:max-h-full relative"
      role="region"
      aria-label={tMagic("mainRegion")}>
      <div className="grid grid-cols-1 md:grid-cols-[1fr] xl:grid-cols-[1fr_1fr] 2xl:grid-cols-[1.35fr_1fr] min-[1920px]:grid-cols-[1.5fr_1fr] min-[2560px]:grid-cols-[1.65fr_1fr] gap-2 md:gap-4 min-h-0 max-xl:h-auto xl:flex-1 xl:min-h-0 xl:h-full xl:overflow-hidden">
        {/* Left column: Spell list (hidden on mobile when showing details) */}
        <div
          className={`flex flex-col gap-2 md:gap-4 min-h-0 max-xl:h-auto max-xl:overflow-visible xl:h-full xl:overflow-hidden ${showMobileDetails ? "hidden xl:flex" : "flex"}`}>
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
              <>
                {preparedCapacityReachedView ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="gap-3 p-2 md:px-6 flex-row items-center cursor-default">
                        <Book
                          className="shrink-0"
                          aria-hidden="true"
                        />
                        <span
                          className="text-sm md:text-base hidden sm:inline"
                          aria-label={`${tMagic("preparedSpells")}: ${tMagic("preparedSpellsUsage", { current: currentPreparedCountView, max: maxPreparedForView })}`}>
                          {tMagic("preparedSpells")}:{" "}
                          <strong>
                            {tMagic("preparedSpellsUsage", {
                              current: currentPreparedCountView,
                              max: maxPreparedForView,
                            })}
                          </strong>
                        </span>
                        <span
                          className="text-sm sm:hidden"
                          aria-label={`${tMagic("preparedSpells")}: ${tMagic("preparedSpellsUsage", { current: currentPreparedCountView, max: maxPreparedForView })}`}>
                          {tMagic("preparedShort")}:{" "}
                          <strong>
                            {tMagic("preparedSpellsUsage", {
                              current: currentPreparedCountView,
                              max: maxPreparedForView,
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
                      aria-label={`${tMagic("preparedSpells")}: ${tMagic("preparedSpellsUsage", { current: currentPreparedCountView, max: maxPreparedForView })}`}>
                      {tMagic("preparedSpells")}:{" "}
                      <strong>
                        {tMagic("preparedSpellsUsage", {
                          current: currentPreparedCountView,
                          max: maxPreparedForView,
                        })}
                      </strong>
                    </span>
                    <span
                      className="text-sm sm:hidden"
                      aria-label={`${tMagic("preparedSpells")}: ${tMagic("preparedSpellsUsage", { current: currentPreparedCountView, max: maxPreparedForView })}`}>
                      {tMagic("preparedShort")}:{" "}
                      <strong>
                        {tMagic("preparedSpellsUsage", {
                          current: currentPreparedCountView,
                          max: maxPreparedForView,
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
          <div className="flex flex-col gap-2 max-xl:flex-none xl:flex-1 xl:min-h-0 xl:overflow-hidden">
            <Card className="gap-2 sm:gap-3 p-4 md:px-6 h-fit flex-row flex-wrap items-center justify-between gap-y-2">
              <h2 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>{tMagic("spells")}</h2>
              <div className="flex items-center gap-2 shrink-0">
                {showPreparedSpellsControls ? (
                  <Button
                    type="button"
                    variant={preparationEditMode ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "rounded-[15px] text-xs sm:text-sm gap-1.5",
                      preparationEditMode && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                    )}
                    onClick={() => setPreparationEditMode((v) => !v)}>
                    {preparationEditMode ? (
                      <BookOpenCheck className="size-4 shrink-0" />
                    ) : (
                      <BookOpen className="size-4 shrink-0" />
                    )}
                    <span>
                      {preparationEditMode ? tMagic("finishChangingPrepared") : tMagic("changePreparedSpells")}
                    </span>
                  </Button>
                ) : null}
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

            {preparationEditMode && showPreparedSpellsControls ? (
              <div
                className="rounded-[15px] border border-border bg-muted/40 px-3 py-2.5 sm:px-4 text-sm"
                role="status">
                <div className="flex gap-2.5 items-start">
                  <BookOpen
                    className="size-4 shrink-0 text-muted-white mt-0.5"
                    aria-hidden
                  />
                  <p className="leading-snug text-white">{tMagic("preparationModeBanner")}</p>
                </div>
              </div>
            ) : null}

            <nav
              className="flex flex-col gap-2 sm:gap-3 max-xl:min-h-[min(50svh,32rem)] max-xl:overflow-visible max-xl:flex-none xl:min-h-0 xl:flex-1 xl:overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full"
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
                                      key={`${key}-spell-${index}`}
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
                      if (!Number.isFinite(n)) return;
                      if (!levels.includes(n)) levels.push(n);
                    });
                  }

                  // Add all levels that have spells (even without slots)
                  if (activeSpellcasting.spells) {
                    activeSpellcasting.spells.forEach((spell) => {
                      const n = Number(spell.level);
                      if (!Number.isFinite(n)) return;
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
                        const spells = sortSpellsPreparedFirst(
                          getSpellByLevel(activeSpellcasting, level),
                          level,
                          appliesPrepMechanic,
                        );
                        const slotKey = String(level);
                        const slot = activeSpellcasting.spellSlotsByLevel?.[slotKey];
                        const spellsList = activeSpellcasting.spells ?? [];

                        return (
                          <AccordionItem
                            key={`spell-level-${slotKey}`}
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
                                {spells.map((spell, spellRowIndex) => {
                                  const rowKey = `lvl-${level}-row-${spellRowIndex}`;
                                  const isCantripRow = level === 0;
                                  const showBookmarks = appliesPrepMechanic && !isCantripRow;
                                  const prepEditRow =
                                    preparationEditMode &&
                                    showBookmarks &&
                                    prepSavingKey === null &&
                                    showPreparedSpellsControls;

                                  if (!showBookmarks) {
                                    return (
                                      <Card
                                        ref={selectedSpell === spell ? selectedSpellRef : null}
                                        onClick={() => handleSpellSelect(spell)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            handleSpellSelect(spell);
                                          }
                                        }}
                                        key={rowKey}
                                        className={`${selectedSpell === spell && `border`} hover:border border-${accentColor} gap-2 p-2 md:px-4 flex-row items-center cursor-pointer`}
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={selectedSpell === spell}
                                        aria-label={`${tMagic("selectSpell")}: ${spell.name}`}>
                                        <span
                                          className={`truncate text-sm md:text-base lg:text-lg flex-1 min-w-0 ${selectedSpell === spell && "font-bold"} `}>
                                          {spell.name}
                                        </span>
                                      </Card>
                                    );
                                  }

                                  const spellIdx = findSpellIndexInList(spellsList, spell);
                                  const countExcl =
                                    spellIdx >= 0
                                      ? spellsList.reduce((acc, s, i) => {
                                          if (i === spellIdx) return acc;
                                          if (Number(s.level) > 0 && s.prepared === true) return acc + 1;
                                          return acc;
                                        }, 0)
                                      : 0;
                                  const prepareBlockedBookmark =
                                    spell.prepared !== true &&
                                    maxPreparedForView > 0 &&
                                    countExcl >= maxPreparedForView;

                                  const openDetail = () => handleSpellSelect(spell);

                                  return (
                                    <Card
                                      ref={selectedSpell === spell ? selectedSpellRef : null}
                                      onClick={openDetail}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          openDetail();
                                        }
                                      }}
                                      key={rowKey}
                                      className={`${selectedSpell === spell && `border`} hover:border border-${accentColor} gap-2 py-2 pl-2 pr-2 md:pl-3 md:pr-3 flex-row items-center cursor-pointer`}
                                      role="button"
                                      tabIndex={0}
                                      aria-pressed={selectedSpell === spell}
                                      aria-label={`${tMagic("selectSpell")}: ${spell.name}`}>
                                      <div className="flex flex-row items-center gap-2 min-w-0 flex-1">
                                        <SpellPreparedPill
                                          isPrepared={spell.prepared === true}
                                          interactive={prepEditRow}
                                          prepareBlocked={prepareBlockedBookmark}
                                          onToggle={() => void toggleSpellPreparedRemote(spell, level)}
                                          preparedTooltip={tMagic("preparedBookmarkPreparedTooltip")}
                                          unpreparedTooltip={tMagic("preparedBookmarkUnpreparedTooltip")}
                                          prepareBlockedTooltip={tMagic("spellPrepareLimitTooltip")}
                                          ariaPrepared={tMagic("preparedPillAriaPrepared")}
                                          ariaUnprepared={tMagic("preparedPillAriaUnprepared")}
                                        />
                                        <span
                                          className={cn(
                                            "truncate text-sm md:text-base lg:text-lg flex-1 min-w-0",
                                            selectedSpell === spell && "font-bold",
                                          )}>
                                          {spell.name}
                                        </span>
                                      </div>
                                    </Card>
                                  );
                                })}
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
          className={`flex flex-col gap-2 min-h-0 max-xl:h-auto xl:h-full max-xl:overflow-visible xl:overflow-hidden xl:border-l xl:pl-4 ${showMobileDetails ? "flex" : "hidden xl:flex"}`}
          role="region"
          aria-label={tMagic("spellDetailRegion")}>
          {/* Back button: single-column layouts through laptop */}
          <button
            type="button"
            onClick={handleBackToList}
            className="xl:hidden flex items-center gap-2 py-3 px-4 text-sm font-medium hover:bg-muted rounded-lg transition-colors shrink-0"
            aria-label={tMagic("backToList")}>
            <ArrowLeft className="w-4 h-4" />
            <span>{tMagic("backToList")}</span>
          </button>
          <SpellDisplay
            spell={selectedSpell}
            accentColor={accentColor}
            attackBonus={activeSpellcasting?.attackBonus ?? null}
            isNpc={!isPlayer(character)}
            preparationStatusBadge={
              isPlayer(character) &&
              activeSpellcasting &&
              classWithSpellPrepared(activeSpellcasting) &&
              selectedSpell &&
              (selectedSpell.level ?? 0) > 0
                ? selectedSpell.prepared === true
                  ? "prepared"
                  : "unprepared"
                : "hidden"
            }
            titleEndContent={
              onCharacterUpdate ? (
                <SpellCastControls
                  characterKind={isPlayer(character) ? "players" : "npcs"}
                  character={character as Player | NPC}
                  spellcasting={activeSpellcasting}
                  selectedSpell={selectedSpell}
                  onCharacterUpdate={onCharacterUpdate}
                />
              ) : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
