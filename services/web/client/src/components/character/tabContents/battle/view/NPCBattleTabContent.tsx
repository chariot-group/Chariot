import { useTranslations } from "next-intl";
import { useId } from "react";
import { NPC } from "@/types/character";
import SavingThrow from "@/components/character/tabContents/general/shared/SavingThrow";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import ActionSection from "@/components/character/tabContents/battle/shared/ActionSection";
import AffinitiesCard from "@/components/character/tabContents/battle/shared/AffinitiesCard";
import {
  BATTLE_BENTO_GRID_CLASS,
  NPC_BATTLE_SLOTS as SLOTS,
} from "@/components/character/tabContents/battle/shared/battleBentoLayout";
import AbilitiesSection from "@/components/character/tabContents/shared/AbilitiesSection";
import NpcStatistics from "@/components/character/tabContents/shared/NpcStatistics";

interface Props {
  npc: NPC;
  accentColor: string;
  onCharacterUpdate?: (updated?: NPC) => void;
}

/** @see FR-character-battle-bento-layout */
const NPCBattleTabContent = ({ npc, accentColor, onCharacterUpdate }: Props) => {
  const t = useTranslations("characterDetail.battle");
  const sectionId = useId();
  const savingThrowsHeadingId = `${sectionId}-saving-throws-heading`;
  const abilitiesHeadingId = `${sectionId}-abilities-traits-heading-npc`;
  const affinitiesHeadingId = `${sectionId}-battle-affinities-heading-npc`;

  return (
    <div className={BATTLE_BENTO_GRID_CLASS}>
      <NpcStatistics
        npc={npc}
        accentColor={accentColor}
        className={`${SLOTS.statistics} justify-between`}
      />

      <GeneralSectionCard
        headingId={savingThrowsHeadingId}
        title={t("savingThrows")}
        accentColor={accentColor}
        className={SLOTS.savingThrows}>
        <div
          className="grid flex-1 grid-cols-3 content-evenly gap-x-2 gap-y-1"
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

      <AffinitiesCard
        affinities={npc.affinities}
        headingId={affinitiesHeadingId}
        accentColor={accentColor}
        className={SLOTS.affinities}
      />

      <ActionSection
        title={t("actions")}
        actions={npc.actions.standard}
        accentColor={accentColor}
        className={SLOTS.actions}
        boundedList
      />
      <ActionSection
        title={t("legendaryActions")}
        actions={npc.actions.legendary}
        accentColor={accentColor}
        className={SLOTS.actions}
        boundedList
      />
      <ActionSection
        title={t("lairActions")}
        actions={npc.actions.lair}
        accentColor={accentColor}
        className={SLOTS.actions}
        boundedList
      />

      <AbilitiesSection
        abilities={npc.abilities}
        accentColor={accentColor}
        title={t("abilitiesAndTraits")}
        headingId={abilitiesHeadingId}
        className={`gap-3 ${SLOTS.abilities}`}
        boundedList
        characterId={npc._id}
        characterKind="npcs"
        onAfterAbilityUse={onCharacterUpdate}
      />
    </div>
  );
};

export default NPCBattleTabContent;
