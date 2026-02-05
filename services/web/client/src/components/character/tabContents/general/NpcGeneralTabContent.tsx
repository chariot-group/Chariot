import { Card } from "@/components/ui/card";
import { NPC } from "@/types/character";
import {
  Brain,
  Church,
  CircleQuestionMark,
  CrossIcon,
  Drama,
  Eye,
  Footprints,
  LockKeyhole,
  MessageSquare,
  MicVocal,
  Notebook,
  PawPrint,
  Sparkles,
  Sprout,
  TreePine,
  User2Icon,
  VenetianMask,
} from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Competence from "@/components/character/tabContents/general/Competence";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Characteristics from "@/components/character/tabContents/general/Characteristics";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NpcGeneralTabContentProps {
  npc: NPC;
  accentColor: string;
}

export default function NpcGeneralTabContent({ npc, accentColor }: NpcGeneralTabContentProps) {
  const t = useTranslations("characterDetail.player.general");
  const tPlayer = useTranslations("characterDetail.player");

  function infoExhaustionLevel(level: number): string {
    return t(`exhaustionLevels.${level}`);
  }

  return (
    <div
      className="w-full flex flex-col gap-2 px-2 sm:px-0"
      role="main"
      aria-label={t("characterInfoLabel")}>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
        {/* Colonne 1 : Personnage et Maitrises */}
        <section
          className="flex flex-col gap-2"
          aria-labelledby="character-info-section">
          {/* Personnage */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="character-heading">
            <h2
              id="character-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("character")}
            </h2>
            <dl className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <dt className="text-sm sm:text-base font-semibold">{t("raceLabel")} :</dt>
                <dd className="text-sm sm:text-base">{npc?.profile?.type}</dd>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <dt className="text-sm sm:text-base font-semibold">{t("classes")} :</dt>
                <dd className="text-sm sm:text-base">{npc?.profile?.subtype}</dd>
              </div>
            </dl>
          </Card>

          {/* Maitrise */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="proficiencies-heading">
            <h2
              id="proficiencies-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("languages")}
            </h2>
            <dl className="flex flex-col gap-2">
              <div className="flex flex-col">
                <dd className="text-sm sm:text-base">{npc?.stats?.languages.join(", ")}</dd>
              </div>
            </dl>
          </Card>

          {/* Jet de sauvegarde */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="saving-throws-heading">
            <h2
              id="saving-throws-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("savingThrows")}
            </h2>
            <dl
              className="flex flex-col gap-2"
              role="list">
              {npc?.stats &&
                Object.entries(npc?.stats?.savingThrows).map(([key, value]) => {
                  const abilityName = t(`abilities.${key}`);
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-2"
                      role="listitem">
                      <div className="flex items-center gap-2 flex-1">
                        <dt className="text-sm sm:text-base font-semibold">{abilityName} :</dt>
                        <dd className="text-sm sm:text-base">{value >= 0 ? `+${value}` : value}</dd>
                      </div>
                    </div>
                  );
                })}
            </dl>
          </Card>
        </section>

        {/* Colonne 2 : Caractéristiques et Compétences */}
        <section
          className="flex flex-col gap-2"
          aria-labelledby="characteristics-skills-section">
          {/* Caractéristiques */}
          <Characteristics
            character={npc}
            accentColor={accentColor}
          />
        </section>

        {/* Colonne 3 : Alignement, Perception passive, Historique et Aptitudes */}
        <section
          className="flex flex-col gap-2"
          aria-labelledby="additional-info-section">
          {/* Alignement */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="alignment-heading">
            <h2
              id="alignment-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {tPlayer("alignment")}
            </h2>
            <p
              className="font-semibold text-sm sm:text-base"
              aria-label={`${tPlayer("alignment")} : ${npc?.profile?.alignment}`}>
              {npc?.profile?.alignment}
            </p>
          </Card>

          {/* Perception passive */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="passive-perception-heading">
            <h2
              id="passive-perception-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("passivePerception")}
            </h2>
            <p
              className="font-semibold text-lg sm:text-xl"
              aria-label={`${t("passivePerception")} : ${npc?.stats?.passivePerception}`}>
              {npc?.stats?.passivePerception}
            </p>
          </Card>

          {/* Aptitudes */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="abilities-heading">
            <h2
              id="abilities-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("characterAbilities")}
            </h2>
            <Accordion
              type="single"
              collapsible
              className="w-full">
              {npc?.abilities.map((ability, index) => (
                <AccordionItem
                  key={ability.name}
                  value={ability.name}>
                  <AccordionTrigger
                    className="text-left hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded py-3"
                    aria-label={`${t("abilityDetails")} ${ability.name}`}>
                    <span className="text-sm sm:text-base font-medium">{ability.name}</span>
                  </AccordionTrigger>
                  <AccordionContent
                    className="text-sm sm:text-base pb-3 pt-1"
                    role="region"
                    aria-label={`${t("abilityDescription")} ${ability.name}`}>
                    {ability.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>
      </div>
    </div>
  );
}
