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
import { useTranslations } from "next-intl";
import AbilityScores from "@/components/character/tabContents/general/shared/AbilityScores";
import { calculateAbilityBonus } from "@/utils/global.utils";
import Skill from "@/components/character/tabContents/general/shared/SavingThrow";
import AbilitiesSection from "@/components/character/tabContents/shared/AbilitiesSection";
import SavingThrow from "@/components/character/tabContents/general/shared/SavingThrow";
import SkillsNpc from "../shared/SkillsNpc";

interface NpcGeneralTabContentProps {
  npc: NPC;
  accentColor: string;
}

export default function NpcGeneralTabContent({ npc, accentColor }: NpcGeneralTabContentProps) {
  const t = useTranslations("characterDetail.player.general");
  const tPlayer = useTranslations("characterDetail.player");
  const tNpc = useTranslations("characterDetail.npc");
  const tAlignment = useTranslations("alignments");
  const tEdit = useTranslations("characterDetail.edit");

  return (
    <div
      className="w-full flex flex-col gap-2 px-2 sm:px-0"
      role="main"
      aria-label={tNpc("general.npcInfoLabel")}>
      <div className="grid grid-cols-1 min-[450px]:grid-cols-2 lg:grid-cols-3 gap-2">
        {/* Colonne 1 : Personnage et Maitrises */}
        <section
          className="flex flex-col gap-2 md:gap-4"
          aria-labelledby="character-info-section"
          aria-label={tNpc("general.characterInfo")}>
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
            <dl className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-1">
                <dt className="text-sm sm:text-base font-semibold">{tEdit("firstname")} :</dt>
                <dd className="text-sm sm:text-base">{npc?.firstname}</dd>
              </div>
              {npc.lastname && (
                <div className="flex flex-wrap gap-1">
                  <dt className="text-sm sm:text-base font-semibold">{tEdit("lastname")} :</dt>
                  <dd className="text-sm sm:text-base">{npc?.lastname}</dd>
                </div>
              )}
              {npc.surname && (
                <div className="flex flex-wrap gap-1">
                  <dt className="text-sm sm:text-base font-semibold">{tEdit("surname")} :</dt>
                  <dd className="text-sm sm:text-base">{npc?.surname}</dd>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <dt className="text-sm sm:text-base font-semibold">{tNpc("typeLabel")} :</dt>
                <dd className="text-sm sm:text-base">
                  {npc?.profile?.type} {npc?.profile?.subtype?.length > 0 && `(${npc?.profile?.subtype})`}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Caractéristiques */}
          <div className="order-3 min-[450px]:order-2">
            <AbilityScores
              character={npc}
              accentColor={accentColor}
            />
          </div>

          {/* Maitrise */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 order-4 min-[450px]:order-3"
            role="region"
            aria-labelledby="languages-heading">
            <h2
              id="languages-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("languages")}
            </h2>
            <dl className="flex flex-col gap-2">
              <div className="flex flex-col">
                <dd
                  className="text-sm sm:text-base"
                  aria-label={`${t("languages")} : ${npc?.stats?.languages?.length > 0 ? npc.stats.languages.join(", ") : t("noLanguages")}`}>
                  {npc?.stats?.languages?.length > 0 ? npc.stats.languages.join(", ") : t("noLanguages")}
                </dd>
              </div>
            </dl>
          </Card>
        </section>

        {/* Colonne 2 : Jets de sauvegarde et Compétences */}
        <section
          className="flex flex-col gap-2 md:gap-4 order-2 min-[450px]:order-0"
          aria-labelledby="characteristics-skills-section"
          aria-label={tNpc("general.characteristicsSkills")}>
          {/* Jets de sauvegarde */}
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
              {npc?.stats &&
                Object.entries(npc?.stats?.savingThrows).map(([key, value]) => {
                  const abilityName = t(`abilities.${key}`);
                  return (
                    <SavingThrow
                      key={key}
                      label={abilityName}
                      skillName={key as keyof typeof npc.stats.abilityScores}
                      accentColor={accentColor}
                      stats={npc?.stats}
                    />
                  );
                })}
            </div>
          </div>

          {/* Compétences */}
          <div className="flex flex-col gap-2">
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
            <SkillsNpc stats={npc?.stats} />
          </div>
        </section>

        {/* Colonne 3 : Alignement, Perception passive et Aptitudes */}
        <section
          className="flex flex-col gap-2 md:gap-4 order-5 min-[450px]:order-0"
          aria-labelledby="additional-info-section"
          aria-label={tNpc("general.additionalInfo")}>
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
              aria-label={`${tPlayer("alignment")} : ${tAlignment(npc?.profile?.alignment)}`}>
              {tAlignment(npc?.profile?.alignment)}
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
          <AbilitiesSection
            abilities={npc.abilities}
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
