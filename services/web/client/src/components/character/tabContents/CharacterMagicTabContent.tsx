"use client";

import { AccordionTrigger, Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Character, Spell, Spellcasting } from "@/types/character";
import { Book, Dice5, Target, ArrowLeft, Eye } from "lucide-react";
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

  const [showMobileDetails, setShowMobileDetails] = useState(false);

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
        <div className={`flex flex-col gap-2 md:gap-4 h-full overflow-hidden ${showMobileDetails ? "hidden lg:flex" : "flex"}`}>
          {character?.spellcasting?.length > 1 && (
            <nav
              className="flex flex-col sm:flex-row gap-2 shrink-0"
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
          <div className="flex flex-wrap gap-2 shrink-0">
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
            className="flex flex-col gap-2 sm:gap-3 flex-1 overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full"
            role="navigation"
            aria-label={tMagic("spellListRegion")}>
            {selectedSpellcasting && !hasLevel0Spells(selectedSpellcasting) && (
              <Card className="gap-3 py-4 px-4 md:px-6 flex-row items-center">
                <span className={`${accentColor} text-base md:text-lg font-medium`}>{tMagic("noCantrips")}</span>
              </Card>
            )}
            {selectedSpellcasting && hasLevel0Spells(selectedSpellcasting) && (
              <div className="flex-col flex gap-2">
                <Card className={`gap-3 py-4 px-4 md:px-6 flex-row items-center`}>
                  <h2 className={`text-xl md:text-2xl font-semibold ${accentColor} `}>{tMagic("cantrips")}</h2>
                </Card>
                <div
                  className="flex flex-wrap gap-2"
                  role="list">
                  {getSpellByLevel(selectedSpellcasting, 0).map((spell, index) => (
                    <Card
                      onClick={() => setSelectedSpell(spell)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedSpell(spell);
                        }
                      }}
                      key={index}
                      className={`${selectedSpell === spell && `border`} hover:border border-${accentColor} gap-3 py-4 px-4 md:px-6 flex-col cursor-pointer`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selectedSpell === spell}
                      aria-label={spell.name}>
                      <span className={`text-sm md:text-base lg:text-lg ${selectedSpell === spell && "font-bold"} `}>
                        {spell.name}
                      </span>
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
                    className={`gap-3 py-4 px-4 md:px-6 flex-row items-center ${accentColor}`}
                    role="heading"
                    aria-level={3}>
                    <h2 className={`text-xl md:text-2xl font-semibold`}>
                      {tMagic("spellLevel", { level })}: {tMagic("spellSlots", { used: slot.used, total: slot.total })}
                    </h2>
                  </Card>
                  <div
                    className="flex flex-wrap gap-2"
                    role="list">
                    {getSpellByLevel(selectedSpellcasting, parseInt(level)).map((spell, index) => (
                      <Card
                        onClick={() => setSelectedSpell(spell)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedSpell(spell);
                          }
                        }}
                        key={index}
                        className={`${selectedSpell === spell && `border`} hover:border border-${accentColor} gap-3 py-4 px-4 md:px-6 flex-col cursor-pointer`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedSpell === spell}
                        aria-label={spell.name}>
                        <span className={`text-sm md:text-base lg:text-lg ${selectedSpell === spell && `font-bold`} `}>
                          {spell.name}
                        </span>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </nav>
        </div>
        {/* Right column: Spell details (visible on mobile when showMobileDetails is true, always visible on desktop) */}
        <div
          className={`flex flex-col gap-2 h-full overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full ${showMobileDetails ? "flex" : "hidden lg:flex"}`}
          role="region"
          aria-label={tMagic("spellDetailRegion")}>
          {/* Back button for mobile */}
          <button
            onClick={() => setShowMobileDetails(false)}
            className="lg:hidden flex items-center gap-2 py-3 px-4 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
            aria-label={tMagic("backToList")}>
            <ArrowLeft className="w-4 h-4" />
            <span>{tMagic("backToList")}</span>
          </button>
          <Card className="gap-3 py-4 px-4 md:px-6 flex-col">
            <h3 className={`${accentColor} text-lg sm:text-xl md:text-2xl font-semibold`}>{selectedSpell?.name}</h3>
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
      {/* Floating button for mobile when spell is selected */}
      {selectedSpell && !showMobileDetails && (
        <button
          onClick={() => setShowMobileDetails(true)}
          className="lg:hidden fixed bottom-6 right-6 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium z-50"
          aria-label={tMagic("viewDetails")}>
          <Eye className="w-5 h-5" />
          <span>{tMagic("viewDetails")}</span>
        </button>
      )}
    </div>
  );
}
