import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId } from "react";
import RedCircle from "@public/assets/icons/red-circle.svg";
import WhiteCircle from "@public/assets/icons/white-circle.svg";
import { Player } from "@/types/character";
import SavingThrow from "@/components/character/tabContents/general/shared/SavingThrow";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import ActionSection from "@/components/character/tabContents/battle/shared/ActionSection";
import AffinitiesCard from "@/components/character/tabContents/battle/shared/AffinitiesCard";
import {
  BATTLE_BENTO_GRID_CLASS,
  PLAYER_BATTLE_SLOTS as SLOTS,
} from "@/components/character/tabContents/battle/shared/battleBentoLayout";
import AbilitiesSection from "@/components/character/tabContents/shared/AbilitiesSection";
import Statistics from "@/components/character/tabContents/shared/Statistics";

interface Props {
  player: Player;
  accentColor: string;
  onCharacterUpdate?: (updated?: Player) => void;
}

/** @see FR-character-battle-bento-layout */
const PlayerBattleTabContent = ({ player, accentColor, onCharacterUpdate }: Props) => {
  const t = useTranslations("characterDetail.battle");
  const sectionId = useId();
  const savingThrowsHeadingId = `${sectionId}-saving-throws-heading`;
  const deathSavesHeadingId = `${sectionId}-death-saves-heading`;
  const abilitiesHeadingId = `${sectionId}-abilities-traits-heading`;
  const affinitiesHeadingId = `${sectionId}-battle-affinities-heading-player`;

  return (
    <div className={BATTLE_BENTO_GRID_CLASS}>
      <Statistics
        player={player}
        accentColor={accentColor}
        onCharacterUpdate={onCharacterUpdate}
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
          {player?.stats &&
            Object.keys(player.stats.savingThrows).map((key) => (
              <SavingThrow
                key={key}
                skillName={key as keyof typeof player.stats.abilityScores}
                accentColor={accentColor}
                stats={player.stats}
              />
            ))}
        </div>
      </GeneralSectionCard>

      <GeneralSectionCard
        headingId={deathSavesHeadingId}
        title={t("deathSaves")}
        accentColor={accentColor}
        className={SLOTS.deathSaves}>
        <div className="grid w-full flex-1 grid-cols-[auto_1fr] content-evenly items-center gap-x-4 gap-y-2">
          <span>{t("successes")}</span>
          <div
            className="grid grid-cols-3 gap-1 w-full max-w-[60px] justify-self-start"
            role="status"
            aria-label={t("deathSaveSuccessesStatus", { count: player.deathSaves.successes })}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Image
                key={"death-save-success-" + index}
                src={index < player.deathSaves.successes ? RedCircle : WhiteCircle}
                alt=""
                width={20}
                height={20}
                className="shrink-0 w-5 h-5"
                aria-hidden="true"
              />
            ))}
          </div>
          <span>{t("failures")}</span>
          <div
            className="grid grid-cols-3 gap-1 w-full max-w-[60px] justify-self-start"
            role="status"
            aria-label={t("deathSaveFailuresStatus", { count: player.deathSaves.failures })}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Image
                key={"death-save-failure-" + index}
                src={index < player.deathSaves.failures ? RedCircle : WhiteCircle}
                alt=""
                width={20}
                height={20}
                className="shrink-0 w-5 h-5"
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </GeneralSectionCard>

      <AffinitiesCard
        affinities={player.affinities}
        headingId={affinitiesHeadingId}
        accentColor={accentColor}
        className={SLOTS.affinities}
      />

      <ActionSection
        title={t("actions")}
        actions={player.actions}
        accentColor={accentColor}
        className={SLOTS.actions}
        boundedList
      />

      <AbilitiesSection
        abilities={player.abilities}
        accentColor={accentColor}
        title={t("abilitiesAndTraits")}
        headingId={abilitiesHeadingId}
        className={`gap-3 ${SLOTS.abilities}`}
        boundedList
        characterId={player._id}
        characterKind="players"
        onAfterAbilityUse={onCharacterUpdate}
      />
    </div>
  );
};

export default PlayerBattleTabContent;
