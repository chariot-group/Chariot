import { Card } from "@/components/ui/card";
import { Player } from "@/types/character";
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

interface PlayerGeneralTabContentProps {
  player: Player;
  accentColor: string;
}

export default function PlayerGeneralTabContent({ player, accentColor }: PlayerGeneralTabContentProps) {
  const t = useTranslations("characterDetail.player.general");
  const tPlayer = useTranslations("characterDetail.player");
  const [checked, setChecked] = useState<boolean>(player.inspiration);

  function infoExhaustionLevel(level: number): string {
    return t(`exhaustionLevels.${level}`);
  }

  function isMastered(competence: string): boolean {
    return player.stats.masteriesAbility[competence as keyof typeof player.stats.masteriesAbility] === true;
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
                <dd className="text-sm sm:text-base">{player?.profile?.race}</dd>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <dt className="text-sm sm:text-base font-semibold">{t("globalLevel")} :</dt>
                <dd className="text-sm sm:text-base">
                  {player?.progression?.level ?? 0} ({player?.progression?.experience ?? 0} XP)
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <dt className="text-sm sm:text-base font-semibold">{t("classes")} :</dt>
                <dd className="text-sm sm:text-base">
                  {player?.class.map((c) => `${c.name} ${t("levelLabel")} ${c.level}`).join(" / ")}
                </dd>
              </div>
              {player?.class.map((c) => (
                <div
                  key={c.name}
                  className="flex flex-col sm:flex-row gap-2">
                  <dt className="text-sm sm:text-base font-semibold">
                    {t("subclassOf")} {c.name} :
                  </dt>
                  <dd className="text-sm sm:text-base">{c.subclass}</dd>
                </div>
              ))}
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
              {t("proficiencies")}
            </h2>
            <dl className="flex flex-col gap-2">
              <div className="flex flex-col">
                <dt className="text-sm sm:text-base font-semibold">{t("languages")} :</dt>
                <dd className="text-sm sm:text-base">{player?.stats?.languages.join(", ")}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm sm:text-base font-semibold">{t("tools")} :</dt>
                <dd className="text-sm sm:text-base">{player?.stats?.tools.join(", ")}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm sm:text-base font-semibold">{t("weapons")} :</dt>
                <dd className="text-sm sm:text-base wrap-break-words">{player?.stats?.weapons.join(", ")}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm sm:text-base font-semibold">{t("armors")} :</dt>
                <dd className="text-sm sm:text-base">{player?.stats?.armors.join(", ")}</dd>
              </div>
            </dl>
          </Card>

          {/* Inspiration */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="inspiration-heading">
            <h2
              id="inspiration-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("inspiration")}
            </h2>
            <div className="flex items-center gap-2">
              <Checkbox
                id="inspiration-checkbox"
                checked={checked}
                onCheckedChange={(value) => setChecked(value === true)}
                disabled
                aria-label={`${t("inspiration")} ${checked ? t("inspirationActive") : t("inspirationInactive")}`}
                aria-describedby="inspiration-heading"
              />
              <label
                htmlFor="inspiration-checkbox"
                className="sr-only">
                {t("inspirationState")}
              </label>
            </div>
          </Card>

          {/* Epuisement */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="exhaustion-heading">
            <h2
              id="exhaustion-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("exhaustion")}
            </h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 rounded px-2"
                  aria-label={`${t("exhaustionLevel")} ${player.exhaustionLevel}`}
                  aria-describedby="exhaustion-description">
                  {player.exhaustionLevel}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p id="exhaustion-description">{infoExhaustionLevel(player.exhaustionLevel)}</p>
              </TooltipContent>
            </Tooltip>
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
              {player?.stats &&
                Object.entries(player?.stats?.savingThrows).map(([key, value]) => {
                  const isMasteredKey = isMastered(key);
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
                      <Checkbox
                        id={`mastery-${key}`}
                        checked={isMasteredKey}
                        disabled
                        aria-label={`${t("masteryOf")} ${abilityName} ${isMasteredKey ? t("masteryActive") : t("masteryInactive")}`}
                      />
                      <label
                        htmlFor={`mastery-${key}`}
                        className="sr-only">
                        {t("mastery")} {abilityName}
                      </label>
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
            character={player}
            accentColor={accentColor}
          />

          {/* Compétences */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="skills-heading">
            <h2
              id="skills-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("skills")}
            </h2>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-semibold">{t("proficiencyBonus")} :</span>
                <span
                  className="text-sm sm:text-base"
                  aria-label={`${t("proficiencyBonus")} ${player?.stats?.proficiencyBonus}`}>
                  {player?.stats?.proficiencyBonus}
                </span>
              </div>
            </div>
          </Card>

          <div
            className="grid grid-cols-1 xl:grid-cols-2 gap-2"
            role="list"
            aria-label={t("skillsList")}>
            <Competence
              competence={t("skillNames.acrobatics")}
              value={player?.stats?.masteries.acrobatics}
              icon={<User2Icon aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.dexterity}
            />
            <Competence
              competence={t("skillNames.arcana")}
              value={player?.stats?.masteries.arcana}
              icon={<Sparkles aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.intelligence}
            />
            <Competence
              competence={t("skillNames.athletics")}
              value={player?.stats?.masteries.athletics}
              icon={<Footprints aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.strength}
            />
            <Competence
              competence={t("skillNames.stealth")}
              value={player?.stats?.masteries.stealth}
              icon={<VenetianMask aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.dexterity}
            />
            <Competence
              competence={t("skillNames.animalHandling")}
              value={player?.stats?.masteries.animalHandling}
              icon={<PawPrint aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.wisdom}
            />
            <Competence
              competence={t("skillNames.sleightHand")}
              value={player?.stats?.masteries.sleightHand}
              icon={<LockKeyhole aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.dexterity}
            />
            <Competence
              competence={t("skillNames.history")}
              value={player?.stats?.masteries.history}
              icon={<Notebook aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.intelligence}
            />
            <Competence
              competence={t("skillNames.intimidation")}
              value={player?.stats?.masteries.intimidation}
              icon={<User2Icon aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.charisma}
            />
            <Competence
              competence={t("skillNames.insight")}
              value={player?.stats?.masteries.insight}
              icon={<Brain aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.wisdom}
            />
            <Competence
              competence={t("skillNames.investigation")}
              value={player?.stats?.masteries.investigation}
              icon={<CircleQuestionMark aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.intelligence}
            />
            <Competence
              competence={t("skillNames.medicine")}
              value={player?.stats?.masteries.medicine}
              icon={<CrossIcon aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.wisdom}
            />
            <Competence
              competence={t("skillNames.nature")}
              value={player?.stats?.masteries.nature}
              icon={<Sprout aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.intelligence}
            />
            <Competence
              competence={t("skillNames.perception")}
              value={player?.stats?.masteries.perception}
              icon={<Eye aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.wisdom}
            />
            <Competence
              competence={t("skillNames.persuasion")}
              value={player?.stats?.masteries.persuasion}
              icon={<MessageSquare aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.charisma}
            />
            <Competence
              competence={t("skillNames.religion")}
              value={player?.stats?.masteries.religion}
              icon={<Church aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.intelligence}
            />
            <Competence
              competence={t("skillNames.performance")}
              value={player?.stats?.masteries.performance}
              icon={<MicVocal aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.charisma}
            />
            <Competence
              competence={t("skillNames.survival")}
              value={player?.stats?.masteries.survival}
              icon={<TreePine aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.wisdom}
            />
            <Competence
              competence={t("skillNames.deception")}
              value={player?.stats?.masteries.deception}
              icon={<Drama aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.charisma}
            />
          </div>
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
              aria-label={`${tPlayer("alignment")} : ${player?.profile?.alignment}`}>
              {player?.profile?.alignment}
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
              aria-label={`${t("passivePerception")} : ${player?.stats?.passivePerception}`}>
              {player?.stats?.passivePerception}
            </p>
          </Card>

          {/* Historique */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="background-heading">
            <h2
              id="background-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("background")}
            </h2>
            <p
              className="font-semibold text-sm sm:text-base text-right"
              aria-label={`${t("background")} : ${player?.profile?.history}`}>
              {player?.profile?.history}
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
              {player?.abilities.map((ability, index) => (
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
