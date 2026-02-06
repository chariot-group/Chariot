"use client";

import { AccordionTrigger, Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Character, Spellcasting } from "@/types/character";
import { Book, Dice5, Target } from "lucide-react";
import React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { getSpellByLevel, hasLevel0Spells, numberSpellsPrepare } from "@/utils/magic.utils";
import { isPlayer } from "@/utils/global.utils";

interface CharacterMagicTabContentProps {
  character: Character;
  accentColor: string;
}

export default function CharacterMagicTabContent({ character, accentColor }: CharacterMagicTabContentProps) {
  const tClass = useTranslations("classes");
  const tMagic = useTranslations("characterDetail.magic");
  const [selectedSpellcasting, setSelectedSpellcasting] = useState<Spellcasting | null>(
    character.spellcasting?.[0] || null,
  );

  const [levelSelected, setLevelSelected] = useState<number>(() => {
    if (!selectedSpellcasting) return 0;

    // Vérifier s'il existe au moins 1 sort de niveau 0
    const hasCantrips = selectedSpellcasting.spells.some((spell) => spell.level === 0);

    if (hasCantrips) return 0;

    // Sinon, prendre le premier niveau disponible
    return selectedSpellcasting.spellSlotsByLevel ? Number(Object.keys(selectedSpellcasting.spellSlotsByLevel)[0]) : 0;
  });

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
      className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-4 lg:px-0"
      role="region"
      aria-label={tMagic("mainRegion")}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-4">
        <div className="flex flex-col gap-2 md:gap-4">
          {character?.spellcasting?.length > 1 && (
            <nav
              className="flex flex-col sm:flex-row gap-2"
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
                    className={`gap-3 py-4 px-4 md:px-6 cursor-pointer transition-all duration-200 hover:shadow-md focus-within:ring-1 focus-within:ring-offset-2 ${isSelected && `bg-${accentColor}`}`}
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
                    <h2 className={`${isSelected ? `text-black` : `${accentColor}`} text-xl md:text-2xl font-semibold`}>
                      {className}
                    </h2>
                  </Card>
                );
              })}
            </nav>
          )}
          <div
            className="flex flex-wrap gap-2"
            role="complementary"
            aria-label={tMagic("spellcastingClass")}>
            {isPlayer(character) && numberSpellsPrepare(selectedSpellcasting, character) > 0 && (
              <Card className="gap-3 py-4 px-4 md:px-6 flex-row items-center">
                <Book
                  className="shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm md:text-base">
                  {tMagic("preparedSpells")}: <strong>{numberSpellsPrepare(selectedSpellcasting, character)}</strong>
                </span>
              </Card>
            )}
            <Card className="gap-3 py-4 px-4 md:px-6 flex-row items-center">
              <Target
                className="shrink-0"
                aria-hidden="true"
              />
              <span className="text-sm md:text-base">
                {tMagic("attackBonus")}: <strong>{selectedSpellcasting?.attackBonus}</strong>
              </span>
            </Card>
            <Card className="gap-3 py-4 px-4 md:px-6 flex-row items-center">
              <Dice5
                className="shrink-0"
                aria-hidden="true"
              />
              <span className="text-sm md:text-base">
                {tMagic("saveDC")}: <strong>{selectedSpellcasting?.saveDC}</strong>
              </span>
            </Card>
          </div>
          <nav
            className="flex flex-col gap-2 sm:gap-3"
            role="navigation"
            aria-label={tMagic("spellListRegion")}>
            {selectedSpellcasting && !hasLevel0Spells(selectedSpellcasting) && (
              <Card className="gap-3 py-4 px-4 md:px-6 flex-row items-center">
                <span className={`${accentColor} text-base md:text-lg font-medium`}>{tMagic("noCantrips")}</span>
              </Card>
            )}
            {selectedSpellcasting && hasLevel0Spells(selectedSpellcasting) && (
              <div className="flex-col flex gap-2">
                <Card
                  className={`gap-3 py-4 px-4 md:px-6 flex-row items-center cursor-pointer transition-all duration-200 hover:shadow-md focus-within:ring-1 focus-within:ring-offset-2 ${levelSelected === 0 && `bg-${accentColor}`}`}
                  onClick={() => setLevelSelected(0)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setLevelSelected(0);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={levelSelected === 0}
                  aria-label={tMagic("selectSpellLevel", { level: 0 })}>
                  <h2
                    className={`${levelSelected === 0 ? `text-black` : `${accentColor}`} text-xl md:text-2xl font-semibold`}>
                    {tMagic("cantrips")}
                  </h2>
                </Card>
                <div
                  className="flex flex-wrap gap-2"
                  role="list"
                  aria-label={tMagic("cantrips")}>
                  {getSpellByLevel(selectedSpellcasting, 0).map((spell, index) => (
                    <Card
                      key={index}
                      className="gap-3 py-4 px-4 md:px-6 flex-col"
                      role="listitem">
                      <span className="text-sm md:text-base font-semibold">{spell.name}</span>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {selectedSpellcasting?.spellSlotsByLevel &&
              Object.entries(selectedSpellcasting.spellSlotsByLevel).map(([level, slot]) => (
                <div
                  key={level}
                  className="flex-col flex gap-2">
                  <Card
                    className={`gap-3 py-4 px-4 md:px-6 flex-row items-center cursor-pointer transition-all duration-200 hover:shadow-md focus-within:ring-1 focus-within:ring-offset-2 ${levelSelected === parseInt(level) && `bg-${accentColor}`}`}
                    onClick={() => setLevelSelected(parseInt(level))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setLevelSelected(parseInt(level));
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={levelSelected === parseInt(level)}
                    aria-label={tMagic("selectSpellLevel", { level })}>
                    <h2
                      className={`text-xl md:text-2xl font-semibold ${levelSelected === parseInt(level) ? `text-black` : `${accentColor}`}`}>
                      {tMagic("spellLevel", { level })}: {tMagic("spellSlots", { used: slot.used, total: slot.total })}
                    </h2>
                  </Card>
                  <div
                    className="flex flex-wrap gap-2"
                    role="list"
                    aria-label={tMagic("spellLevel", { level })}>
                    {getSpellByLevel(selectedSpellcasting, parseInt(level)).map((spell, index) => (
                      <Card
                        key={index}
                        className="gap-3 py-4 px-4 md:py-6 md:px-6 flex-col"
                        role="listitem">
                        <span className="text-sm md:text-base lg:text-lg font-semibold">{spell.name}</span>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </nav>
        </div>
        <div
          className="flex flex-col gap-2 md:gap-4"
          role="region"
          aria-label={tMagic("spellDetailRegion")}>
          <Card className="gap-3 py-4 px-4 md:px-6 flex-col">
            <h3 className={`${accentColor} text-lg sm:text-xl md:text-2xl font-semibold`}>
              {tMagic("spellDescriptions", { level: levelSelected })}
            </h3>
          </Card>
          <Accordion
            type="single"
            collapsible
            className="w-full flex flex-col gap-2">
            {getSpellByLevel(selectedSpellcasting, levelSelected).map((spell, index) => (
              <AccordionItem
                key={index}
                value={spell.name}
                className="flex flex-col gap-2">
                <Card className="gap-3 p-0 flex-col">
                  <AccordionTrigger
                    key={index}
                    className="py-3 px-3 md:py-4 md:px-6"
                    aria-label={tMagic("toggleSpellDetails", { spellName: spell.name })}>
                    <span className="text-base md:text-lg font-medium text-left">{spell.name}</span>
                  </AccordionTrigger>
                </Card>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2 items-start">
                    <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                      <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {tMagic("spellDetails.school")}:
                      </span>
                      <span className="text-sm md:text-base wrap-break-word">{spell.school}</span>
                    </Card>
                    <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                      <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {tMagic("spellDetails.castingTime")}:
                      </span>
                      <span className="text-sm md:text-base wrap-break-word">{spell.castingTime}</span>
                    </Card>
                    <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                      <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {tMagic("spellDetails.range")}:
                      </span>
                      <span className="text-sm md:text-base wrap-break-word">{spell.range}</span>
                    </Card>
                    <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                      <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {tMagic("spellDetails.components")}:
                      </span>
                      <span className="text-sm md:text-base wrap-break-word">{spell.components?.join(", ")}</span>
                    </Card>
                    <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                      <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {tMagic("spellDetails.duration")}:
                      </span>
                      <span className="text-sm md:text-base wrap-break-word">{spell.duration}</span>
                    </Card>
                    <Card className="flex flex-col gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
                      <span className={`${accentColor} font-semibold text-sm md:text-base`}>
                        {tMagic("spellDetails.description")}:
                      </span>
                      <span className="text-sm md:text-base leading-relaxed">{spell.description}</span>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
