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
import AbilityScores from "@/components/character/tabContents/general/shared/AbilityScores";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isMastered } from "@/utils/global.utils";
import Skill from "@/components/character/tabContents/general/shared/Skill";
import AbilitiesSection from "@/components/character/tabContents/shared/AbilitiesSection";

interface PlayerGeneralTabContentProps {
  player: Player;
  accentColor: string;
}

export default function PlayerGeneralTabContent({ player, accentColor }: PlayerGeneralTabContentProps) {
  const t = useTranslations("characterDetail.player.general");
  const tPlayer = useTranslations("characterDetail.player");
  const tAlignment = useTranslations("alignments");
  const tClass = useTranslations("classes");
  const [checked, setChecked] = useState<boolean>(player.inspiration);

  function infoExhaustionLevel(level: number): string {
    return t(`exhaustionLevels.${level}`);
  }

  return (
    <div
      className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-0"
      role="main"
      aria-label={t("characterInfoLabel")}>
      <div className="grid grid-cols-1 min-[450px]:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
        {/* Colonne 1 : Personnage et Maitrises */}
        <section
          className="flex flex-col gap-2 md:gap-4"
          aria-labelledby="character-info-section">
          {/* Personnage */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 order-1"
            role="region"
            aria-labelledby="character-heading">
            <h2
              id="character-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("character")}
            </h2>
            <dl className="flex flex-col gap-2 justify-between">
              <div className="flex flex-row gap-2">
                <dt className="text-sm sm:text-base font-semibold">{t("raceLabel")} :</dt>
                <dd className="text-sm sm:text-base">
                  {player?.profile?.race} {player?.profile?.subrace?.length > 0 && `(${player?.profile?.subrace})`}
                </dd>
              </div>
              <div className="flex flex-row gap-2">
                <dt className="text-sm sm:text-base font-semibold">{t("globalLevel")} :</dt>
                <dd className="text-sm sm:text-base">
                  {player?.progression?.level ?? 0} ({player?.progression?.experience ?? 0} XP)
                </dd>
              </div>
              <div className="flex flex-row gap-2">
                <dt className="text-sm sm:text-base font-semibold">{t("classes")} :</dt>
                <dd className="text-sm sm:text-base">
                  {player?.class.map((c) => `${tClass(c.name)} ${t("levelLabel")} ${c.level}`).join(" / ")}
                </dd>
              </div>
              {player?.class.map((c) => (
                <div
                  key={c.name}
                  className="flex flex-row gap-2">
                  <dt className="text-sm sm:text-base font-semibold">
                    {t("subclassOf")} {tClass(c.name)} :
                  </dt>
                  <dd className="text-sm sm:text-base">{c.subclass}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Caractéristiques */}
          <div className="order-3 min-[450px]:order-2">
            <AbilityScores
              character={player}
              accentColor={accentColor}
            />
          </div>

          {/* Maitrise */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 order-4 min-[450px]:order-3"
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
        </section>

        {/* Colonne 2 : Bonus, Jets de sauvegarde et Compétences */}
        <section
          className="flex flex-col gap-2 md:gap-4 order-2 min-[450px]:order-0"
          aria-labelledby="characteristics-skills-section">
          {/* Bonus */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="proficiency-bonus-heading">
            <h2
              id="proficiency-bonus-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("proficiencyBonus")}
            </h2>
            <p
              className="text-sm sm:text-base font-bold"
              aria-label={`${t("proficiencyBonus")} ${player?.stats?.proficiencyBonus}`}>
              {player?.stats?.proficiencyBonus >= 0
                ? `+${player?.stats?.proficiencyBonus}`
                : `${player?.stats?.proficiencyBonus}`}
            </p>
          </Card>

          {/* Jet de sauvegarde */}
          <div className="flex flex-col gap-2">
            <Card
              className="gap-3 py-4 px-4 md:px-6"
              role="region"
              aria-labelledby="saving-throws-heading">
              <h2
                id="saving-throws-heading"
                className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                {t("savingThrows")}
              </h2>
            </Card>
            <div
              className="grid grid-cols-2 gap-2"
              role="list">
              {player?.stats &&
                Object.entries(player?.stats?.savingThrows).map(([key, value]) => {
                  const isMasteredKey = isMastered(player, key);
                  const abilityName = t(`abilities.${key}`);
                  return (
                    <Skill
                      key={key}
                      skillName={abilityName}
                      value={isMasteredKey ? 2 : 0}
                      accentColor={accentColor}
                      skills={value}
                    />
                  );
                })}
            </div>
          </div>

          {/* Compétences */}
          <div className="flex flex-col gap-2 order-4 min-[450px]:order-3">
            <Card
              className="gap-3 py-4 px-4 md:px-6"
              role="region"
              aria-labelledby="skills-heading">
              <h2
                id="skills-heading"
                className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                {t("skills")}
              </h2>
            </Card>
            <div
              className="grid grid-cols-2 gap-2"
              role="list"
              aria-label={t("skillsList")}>
              <Skill
                skillName={t("skillNames.acrobatics")}
                value={player?.stats?.masteries.acrobatics}
                icon={<User2Icon aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.dexterity}
                tooltip={t("abilities.dexterity")}
              />
              <Skill
                skillName={t("skillNames.arcana")}
                value={player?.stats?.masteries.arcana}
                icon={<Sparkles aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.intelligence}
                tooltip={t("abilities.intelligence")}
              />
              <Skill
                skillName={t("skillNames.athletics")}
                value={player?.stats?.masteries.athletics}
                icon={<Footprints aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.strength}
                tooltip={t("abilities.strength")}
              />
              <Skill
                skillName={t("skillNames.stealth")}
                value={player?.stats?.masteries.stealth}
                icon={<VenetianMask aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.dexterity}
                tooltip={t("abilities.dexterity")}
              />
              <Skill
                skillName={t("skillNames.animalHandling")}
                value={player?.stats?.masteries.animalHandling}
                icon={<PawPrint aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.wisdom}
                tooltip={t("abilities.wisdom")}
              />
              <Skill
                skillName={t("skillNames.sleightHand")}
                value={player?.stats?.masteries.sleightHand}
                icon={<LockKeyhole aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.dexterity}
                tooltip={t("abilities.dexterity")}
              />
              <Skill
                skillName={t("skillNames.history")}
                value={player?.stats?.masteries.history}
                icon={<Notebook aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.intelligence}
                tooltip={t("abilities.intelligence")}
              />
              <Skill
                skillName={t("skillNames.intimidation")}
                value={player?.stats?.masteries.intimidation}
                icon={<User2Icon aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.charisma}
                tooltip={t("abilities.charisma")}
              />
              <Skill
                skillName={t("skillNames.insight")}
                value={player?.stats?.masteries.insight}
                icon={<Brain aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.wisdom}
                tooltip={t("abilities.wisdom")}
              />
              <Skill
                skillName={t("skillNames.investigation")}
                value={player?.stats?.masteries.investigation}
                icon={<CircleQuestionMark aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.intelligence}
                tooltip={t("abilities.intelligence")}
              />
              <Skill
                skillName={t("skillNames.medicine")}
                value={player?.stats?.masteries.medicine}
                icon={<CrossIcon aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.wisdom}
                tooltip={t("abilities.wisdom")}
              />
              <Skill
                skillName={t("skillNames.nature")}
                value={player?.stats?.masteries.nature}
                icon={<Sprout aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.intelligence}
                tooltip={t("abilities.intelligence")}
              />
              <Skill
                skillName={t("skillNames.perception")}
                value={player?.stats?.masteries.perception}
                icon={<Eye aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.wisdom}
                tooltip={t("abilities.wisdom")}
              />
              <Skill
                skillName={t("skillNames.persuasion")}
                value={player?.stats?.masteries.persuasion}
                icon={<MessageSquare aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.charisma}
                tooltip={t("abilities.charisma")}
              />
              <Skill
                skillName={t("skillNames.religion")}
                value={player?.stats?.masteries.religion}
                icon={<Church aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.intelligence}
                tooltip={t("abilities.intelligence")}
              />
              <Skill
                skillName={t("skillNames.performance")}
                value={player?.stats?.masteries.performance}
                icon={<MicVocal aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.charisma}
                tooltip={t("abilities.charisma")}
              />
              <Skill
                skillName={t("skillNames.survival")}
                value={player?.stats?.masteries.survival}
                icon={<TreePine aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.wisdom}
                tooltip={t("abilities.wisdom")}
              />
              <Skill
                skillName={t("skillNames.deception")}
                value={player?.stats?.masteries.deception}
                icon={<Drama aria-hidden="true" />}
                accentColor={accentColor}
                proficiencyBonus={player?.stats?.proficiencyBonus}
                masteriesAbility={player?.stats?.abilityScores.charisma}
                tooltip={t("abilities.charisma")}
              />
            </div>
          </div>
        </section>

        {/* Colonne 3 : Alignement, Perception passive, Historique et Aptitudes */}
        <section
          className="flex flex-col gap-2 md:gap-4 sm:col-span-2 lg:col-span-1 order-5 min-[450px]:order-0"
          aria-labelledby="additional-info-section">
          {/* Epuisement */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="exhaustion-heading">
            <h2
              id="exhaustion-heading"
              className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
              {t("exhaustion")}
            </h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="font-semibold text-lg focus:outline-none focus:ring-1 focus:ring-offset-2 rounded px-2"
                  aria-label={`${t("exhaustionLevel")} ${player.exhaustionLevel}`}
                  aria-describedby="exhaustion-description">
                  {player.exhaustionLevel}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p id="exhaustion-description">{infoExhaustionLevel(player.exhaustionLevel)}</p>
              </TooltipContent>
            </Tooltip>
          </Card>

          {/* Alignement */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="alignment-heading">
            <h2
              id="alignment-heading"
              className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
              {tPlayer("alignment")}
            </h2>
            <p
              className="font-semibold text-sm sm:text-base"
              aria-label={`${tPlayer("alignment")} : ${tAlignment(player?.profile?.alignment)}`}>
              {tAlignment(player?.profile?.alignment)}
            </p>
          </Card>

          {/* Perception passive */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="passive-perception-heading">
            <h2
              id="passive-perception-heading"
              className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
              {t("passivePerception")}
            </h2>
            <p
              className="font-semibold text-lg sm:text-xl"
              aria-label={`${t("passivePerception")} : ${player?.stats?.passivePerception}`}>
              {player?.stats?.passivePerception}
            </p>
          </Card>

          {/* Inspiration */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="inspiration-heading">
            <h2
              id="inspiration-heading"
              className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
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

          {/* Historique */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="background-heading">
            <h2
              id="background-heading"
              className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
              {t("background")}
            </h2>
            <p
              className="font-semibold text-sm sm:text-base sm:text-right"
              aria-label={`${t("background")} : ${player?.profile?.history}`}>
              {player?.profile?.history}
            </p>
          </Card>

          {/* Aptitudes */}
          <AbilitiesSection
            abilities={player.abilities}
            accentColor={accentColor}
            title={t("characterAbilities")}
            headingId="abilities-heading"
            className="gap-3 py-4 px-4 md:px-6"
          />
        </section>
      </div>
    </div>
  );
}
