import CharacterIdentityCard from "@/components/character/tabContents/general/shared/CharacterIdentityCard";
import { NPC, Player } from "@/types/character";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import AbilityScores from "@/components/character/tabContents/general/shared/AbilityScores";
import AbilitiesSection from "@/components/character/tabContents/shared/AbilitiesSection";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import SavingThrow from "@/components/character/tabContents/general/shared/SavingThrow";
import SkillsNpc from "@/components/character/tabContents/general/shared/SkillsNpc";
import {
  GENERAL_BENTO_CONTAINER_CLASS,
  GENERAL_BENTO_GRID_CLASS,
  NPC_VIEW_SLOTS as SLOTS,
} from "@/components/character/tabContents/general/shared/generalBentoLayout";
import NpcStatistics from "@/components/character/tabContents/shared/NpcStatistics";
import SensesSection from "@/components/character/tabContents/general/shared/SensesSection";

interface NpcGeneralTabContentProps {
  npc: NPC;
  accentColor: string;
  /** @see FR-character-detail-view */
  avatar?: ReactNode;
  onCharacterUpdate?: (updated?: Player | NPC) => void;
}

export default function NpcGeneralTabContent({
  npc,
  accentColor,
  avatar,
  onCharacterUpdate,
}: NpcGeneralTabContentProps) {
  const t = useTranslations("characterDetail.player.general");
  const tPlayer = useTranslations("characterDetail.player");
  const tNpc = useTranslations("characterDetail.npc");
  const tAlignment = useTranslations("alignments");

  const languages = npc?.stats?.languages?.length > 0 ? npc.stats.languages.join(", ") : t("noLanguages");

  /** @see FR-character-general-bento-layout */
  return (
    <div className={`${GENERAL_BENTO_CONTAINER_CLASS} px-2 sm:px-0`}>
      <div
        className={GENERAL_BENTO_GRID_CLASS}
        role="main"
        aria-label={tNpc("general.npcInfoLabel")}>
        {/* Personnage */}
        <CharacterIdentityCard
          accentColor={accentColor}
          className={SLOTS.character}
          avatar={avatar}
          firstname={npc?.firstname}
          lastname={npc?.lastname}
          surname={npc?.surname}
          facts={[
            {
              key: "type",
              label: tNpc("typeLabel"),
              value: npc?.profile?.type,
              secondary: npc?.profile?.subtype,
            },
            {
              key: "alignment",
              label: tPlayer("alignment"),
              value: npc?.profile?.alignment ? tAlignment(npc.profile.alignment) : undefined,
            },
          ]}
        />

        <NpcStatistics
          npc={npc}
          accentColor={accentColor}
          className={`${SLOTS.statistics} justify-between`}
          showPassivePerception
        />

        <GeneralSectionCard
          headingId="skills-heading"
          title={t("skills")}
          accentColor={accentColor}
          className={SLOTS.skills}>
          <SkillsNpc stats={npc?.stats} />
        </GeneralSectionCard>

        <AbilityScores
          character={npc}
          accentColor={accentColor}
          className={SLOTS.abilityScores}
        />

        <GeneralSectionCard
          headingId="saving-throws-heading"
          title={t("savingThrows")}
          accentColor={accentColor}
          className={SLOTS.savingThrows}>
          <div
            className="grid flex-1 content-evenly grid-cols-3 gap-x-2 gap-y-1"
            role="list">
            {npc?.stats &&
              Object.keys(npc.stats.savingThrows).map((key) => (
                <SavingThrow
                  key={key}
                  skillName={key as keyof typeof npc.stats.abilityScores}
                  accentColor={accentColor}
                  stats={npc.stats}
                />
              ))}
          </div>
        </GeneralSectionCard>

        <GeneralSectionCard
          headingId="proficiencies-heading"
          title={t("proficiencies")}
          accentColor={accentColor}
          className={SLOTS.proficiencies}>
          <dl className="grid flex-1 content-start gap-x-6 gap-y-3 @lg:grid-cols-2">
            <div className="flex flex-col">
              <dt className="text-sm sm:text-base font-semibold">{t("languages")} :</dt>
              <dd
                className="text-sm sm:text-base wrap-break-word"
                aria-label={`${t("languages")} : ${languages}`}>
                {languages}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm sm:text-base font-semibold">{t("senses")} :</dt>
              <dd>
                <SensesSection
                  senses={npc?.stats?.senses}
                  accentColor={accentColor}
                  embedded
                />
              </dd>
            </div>
          </dl>
        </GeneralSectionCard>

        <AbilitiesSection
          abilities={npc.abilities}
          accentColor={accentColor}
          title={t("characterAbilities")}
          headingId="abilities-heading"
          boundedList
          className={`gap-3 ${SLOTS.abilities}`}
          characterId={npc._id}
          characterKind="npcs"
          onAfterAbilityUse={onCharacterUpdate}
        />
      </div>
    </div>
  );
}
