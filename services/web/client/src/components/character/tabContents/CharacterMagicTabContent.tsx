"use client";

import { AccordionTrigger, Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Character, Class, Player, Spell, Spellcasting } from "@/types/character";
import { Book, Dice5, Target } from "lucide-react";
import React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface CharacterMagicTabContentProps {
  character: Character;
  accentColor: string;
}

export default function CharacterMagicTabContent({ character, accentColor }: CharacterMagicTabContentProps) {
  const tClass = useTranslations("classes");
  const [selectedSpellcasting, setSelectedSpellcasting] = useState<Spellcasting | null>(
    character.spellcasting?.[0] || null,
  );

  const [levelSelected, setLevelSelected] = useState<number>(() => {
    if (!selectedSpellcasting) return 0;

    // Vérifier s'il existe au moins 1 sort de niveau 0
    const hasLevel0Spells = selectedSpellcasting.spells.some((spell) => spell.level === 0);

    if (hasLevel0Spells) return 0;

    // Sinon, prendre le premier niveau disponible
    return selectedSpellcasting.spellSlotsByLevel ? Number(Object.keys(selectedSpellcasting.spellSlotsByLevel)[0]) : 0;
  });

  console.log("Selected Spellcasting:", selectedSpellcasting);

  function hasLevel0Spells(spellcasting: Spellcasting): boolean {
    return spellcasting.spells.some((spell) => spell.level === 0);
  }

  function getSpellByLevel(level: number): Spell[] {
    if (!selectedSpellcasting) return [];
    return selectedSpellcasting.spells.filter((spell) => spell.level === level);
  }

  function numberSpellsPrepare(): number {
    if (!selectedSpellcasting) return 0;
    let total: number = 0;

    if ("progression" in character) {
      const classObj: Class | undefined = (character as Player).class.find(
        (cls) => cls.name.toLocaleLowerCase() === selectedSpellcasting.className.toLocaleLowerCase(),
      );
      if (classObj?.name.toLocaleLowerCase() === "druid") {
        total = classObj.level + Math.floor((character?.stats?.abilityScores?.wisdom - 10) / 2);
      } else if (classObj?.name.toLocaleLowerCase() === "paladin") {
        total = Math.floor(classObj.level / 2) + Math.floor((character?.stats?.abilityScores?.charisma - 10) / 2);
      } else if (classObj?.name.toLocaleLowerCase() === "cleric") {
        total = classObj.level + Math.floor((character?.stats?.abilityScores?.wisdom - 10) / 2);
      } else if (classObj?.name.toLocaleLowerCase() === "mage") {
        total = classObj.level + Math.floor((character?.stats?.abilityScores?.intelligence - 10) / 2);
      }
    }

    return total;
  }

  function isPlayer(): boolean {
    return "progression" in character;
  }

  if (!character.spellcasting || character.spellcasting.length === 0) {
    return (
      <div
        className="w-full flex flex-col gap-2 px-2 sm:px-0"
        role="main">
        <p className="text-center text-muted-foreground">Ce personnage n'a pas de capacités magiques.</p>
      </div>
    );
  }

  return (
    <div
      className="w-full flex flex-col gap-2 px-2 sm:px-0"
      role="main">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          {character?.spellcasting?.length > 1 && (
            <div className="flex flex-row gap-2">
              {character?.spellcasting?.map((spellcasting, index) => {
                let className = "";
                if (isPlayer()) {
                  let classObj = (character as Player).class.find(
                    (cls) => cls.name.toLocaleLowerCase() === spellcasting.className.toLocaleLowerCase(),
                  );
                  className = `${tClass(classObj?.name || "")} Niv ${classObj?.level}` || "";
                } else {
                  className = spellcasting.className;
                }
                return (
                  <Card
                    className={`cursor-pointer transition-colors duration-200 gap-3 py-4 px-4 md:px-6 ${selectedSpellcasting?.className === spellcasting.className && `bg-${accentColor}`}`}
                    onClick={() => setSelectedSpellcasting(spellcasting)}
                    key={index}>
                    <h2
                      className={`${selectedSpellcasting?.className === spellcasting.className ? `text-black` : `${accentColor}`}  text-2xl font-semibold`}>
                      {className}
                    </h2>
                  </Card>
                );
              })}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {isPlayer() && (
              <Card className="gap-3 py-4 px-4 md:px-6 flex-row items-center">
                <Book />
                <span> Nombre de sorts préparés: </span>
                {numberSpellsPrepare()}
              </Card>
            )}
            <Card className="gap-3 py-4 px-4 md:px-6 flex-row items-center">
              <Target />
              <span> Bonus d'attaque: </span>
              {selectedSpellcasting?.attackBonus}
            </Card>
            <Card className="gap-3 py-4 px-4 md:px-6 flex-row items-center">
              <Dice5 />
              <span>Degré de difficulté (DD):</span>
              {selectedSpellcasting?.saveDC}
            </Card>
          </div>
          {selectedSpellcasting && !hasLevel0Spells(selectedSpellcasting) && (
            <Card className="gap-3 py-4 px-4 md:px-6 flex-row items-center">
              <span className={`${levelSelected === 0 ? `text-black` : `${accentColor}`}  text-lg font-medium`}>
                Aucun tour de magie
              </span>
            </Card>
          )}
          {selectedSpellcasting && hasLevel0Spells(selectedSpellcasting) && (
            <React.Fragment>
              <Card
                className={`gap-3 py-4 px-4 md:px-6 flex-row items-center cursor-pointer ${levelSelected === 0 && `bg-${accentColor}`}`}
                onClick={() => setLevelSelected(0)}>
                <span className={`${levelSelected === 0 ? `text-black` : `${accentColor}`}  text-lg font-medium`}>
                  Tour de magie
                </span>
              </Card>
              <div className="flex flex-wrap gap-2">
                {getSpellByLevel(0).map((spell, index) => (
                  <Card
                    key={index}
                    className="gap-3 py-4 px-4 md:px-6 flex-col">
                    <span className="text-lg font-semibold">{spell.name}</span>
                  </Card>
                ))}
              </div>
            </React.Fragment>
          )}
          {selectedSpellcasting?.spellSlotsByLevel &&
            Object.entries(selectedSpellcasting.spellSlotsByLevel).map(([level, slot]) => (
              <React.Fragment key={level}>
                <Card
                  className={`gap-3 py-4 px-4 md:px-6 flex-row items-center cursor-pointer ${levelSelected === parseInt(level) && `bg-${accentColor}`}`}
                  onClick={() => setLevelSelected(parseInt(level))}>
                  <span
                    className={`text-lg font-medium ${levelSelected === parseInt(level) ? `text-black` : `${accentColor}`}`}>
                    Sorts de niveau {level}: {slot.used} / {slot.total}
                  </span>
                </Card>
                <div className="flex flex-wrap gap-2">
                  {getSpellByLevel(parseInt(level)).map((spell, index) => (
                    <Card
                      key={index}
                      className="gap-3 py-4 px-4 md:px-6 flex-col">
                      <span className="text-lg font-semibold">{spell.name}</span>
                    </Card>
                  ))}
                </div>
              </React.Fragment>
            ))}
        </div>
        <div className="flex flex-col gap-2">
          <Card className="gap-3 py-4 px-4 md:px-6 flex-col">
            <h3 className={`${accentColor} text-2xl font-semibold`}>Descriptions des sorts niveau {levelSelected}</h3>
          </Card>
          <Accordion
            type="single"
            collapsible
            className="w-full flex flex-col gap-2">
            {getSpellByLevel(levelSelected).map((spell, index) => (
              <AccordionItem
                key={index}
                value={spell.name}
                className="flex flex-col gap-2">
                <Card className="gap-3 p-0 flex-col">
                  <AccordionTrigger
                    key={index}
                    className="py-4 px-4 md:px-6">
                    <span className="text-lg font-medium">{spell.name}</span>
                  </AccordionTrigger>
                </Card>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2 items-start">
                    <Card className="flex flex-row justify-between py-4 px-4 md:px-6">
                      <span className={`${accentColor} font-semibold`}>École</span> <span>{spell.school}</span>
                    </Card>
                    <Card className="flex flex-row justify-between py-4 px-4 md:px-6">
                      <span className={`${accentColor} font-semibold`}>Temps d'incantation</span>
                      <span>{spell.castingTime}</span>
                    </Card>
                    <Card className="flex flex-row justify-between py-4 px-4 md:px-6">
                      <span className={`${accentColor} font-semibold`}>Portée</span> <span>{spell.range}</span>
                    </Card>
                    <Card className="flex flex-row justify-between py-4 px-4 md:px-6">
                      <span className={`${accentColor} font-semibold`}>Composants</span>
                      <span>{spell.components?.join(", ")}</span>
                    </Card>
                    <Card className="flex flex-row justify-between py-4 px-4 md:px-6">
                      <span className={`${accentColor} font-semibold`}>Durée</span>
                      <span>{spell.duration}</span>
                    </Card>
                    <Card className="flex flex-col justify-between py-4 px-4 md:px-6">
                      <span className={`${accentColor} font-semibold`}>Description</span>
                      <span>{spell.description}</span>
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
