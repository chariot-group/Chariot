import { Card } from "@/components/ui/card";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import GeneralTile from "@/components/character/tabContents/general/shared/GeneralTile";
import SavingThrow from "@/components/character/tabContents/general/shared/SavingThrow";
import Skills from "@/components/character/tabContents/general/shared/Skills";
import {
  GENERAL_BENTO_GRID_CLASS,
  PLAYER_VIEW_SLOTS as SLOTS,
} from "@/components/character/tabContents/general/shared/generalBentoLayout";
import { Player } from "@/types/character";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import AbilityScores from "@/components/character/tabContents/general/shared/AbilityScores";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import AbilitiesSection from "@/components/character/tabContents/shared/AbilitiesSection";
import Statistics from "@/components/character/tabContents/shared/Statistics";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { selectIsInSession } from "@/store/slices/sessionSlice";
import CharacterService from "@/services/CharacterService";
import { toast } from "react-toastify";
import SensesSection from "@/components/character/tabContents/general/shared/SensesSection";

interface PlayerGeneralTabContentProps {
  player: Player;
  accentColor: string;
  /** @see FR-character-detail-view */
  avatar?: ReactNode;
  onCharacterUpdate?: (updated?: Player) => void;
}

export default function PlayerGeneralTabContent({
  player,
  accentColor,
  avatar,
  onCharacterUpdate,
}: PlayerGeneralTabContentProps) {
  const t = useTranslations("characterDetail.player.general");
  const tPlayer = useTranslations("characterDetail.player");
  const tAlignment = useTranslations("alignments");
  const tClass = useTranslations("classes");
  const tEdit = useTranslations("characterDetail.edit");
  const isInSession = useAppSelector(selectIsInSession);
  const [isInspirationLoading, setIsInspirationLoading] = useState(false);

  function infoExhaustionLevel(level: number): string {
    return t(`exhaustionLevels.${level}`);
  }

  const proficiencyBonus = player?.stats?.proficiencyBonus ?? 0;

  /** @see FR-character-general-bento-layout */
  return (
    <div
      className={`${GENERAL_BENTO_GRID_CLASS} px-2 sm:px-0`}
      role="main"
      aria-label={t("characterInfoLabel")}>
      {/* Personnage */}
      <Card
        className={`gap-3 p-4 md:px-6 ${SLOTS.character}`}
        role="region"
        aria-labelledby="character-heading">
        <div className="flex flex-1 items-stretch gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <h2
              id="character-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("character")}
            </h2>
            <dl className="flex flex-1 flex-col justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                <dt className="text-sm sm:text-base font-semibold">{tEdit("firstname")} :</dt>
                <dd className="text-sm sm:text-base">{player?.firstname}</dd>
              </div>
              {player.lastname && (
                <div className="flex flex-wrap gap-1">
                  <dt className="text-sm sm:text-base font-semibold">{tEdit("lastname")} :</dt>
                  <dd className="text-sm sm:text-base">{player?.lastname}</dd>
                </div>
              )}
              {player.surname && (
                <div className="flex flex-wrap gap-1">
                  <dt className="text-sm sm:text-base font-semibold">{tEdit("surname")} :</dt>
                  <dd className="text-sm sm:text-base">{player?.surname}</dd>
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                <dt className="text-sm sm:text-base font-semibold">{t("raceLabel")} :</dt>
                <dd className="text-sm sm:text-base">
                  {player?.profile?.race} {player?.profile?.subrace?.length > 0 && `(${player?.profile?.subrace})`}
                </dd>
              </div>
              <div className="flex flex-wrap gap-1">
                <dt className="text-sm sm:text-base font-semibold">{t("globalLevel")} :</dt>
                <dd className="text-sm sm:text-base">
                  {player?.progression?.level ?? 0} ({player?.progression?.experience ?? 0} XP)
                </dd>
              </div>
              <div className="flex flex-wrap gap-2">
                <dt className="text-sm sm:text-base font-semibold">{t("classes")} :</dt>
                <dd className="text-sm sm:text-base">
                  {player?.class.map((c) => `${tClass(c.name)} ${t("levelLabel")} ${c.level}`).join(" / ")}
                </dd>
              </div>
              {player?.class.map((c) => (
                <div
                  key={c.name}
                  className="flex flex-wrap gap-1">
                  <dt className="text-sm sm:text-base font-semibold">
                    {t("subclassOf")} {tClass(c.name)} :
                  </dt>
                  <dd className="text-sm sm:text-base">{c.subclass}</dd>
                </div>
              ))}
            </dl>
          </div>
          {avatar ? <div className="shrink-0 self-start">{avatar}</div> : null}
        </div>
      </Card>

      <Statistics
        player={player}
        accentColor={accentColor}
        onCharacterUpdate={onCharacterUpdate}
        className={`${SLOTS.statistics} justify-between`}
      />

      <GeneralTile
        headingId="proficiency-bonus-heading"
        title={t("proficiencyBonus")}
        accentColor={accentColor}
        className={SLOTS.tile}>
        <p
          className="text-xl sm:text-2xl font-bold tabular-nums"
          aria-label={`${t("proficiencyBonus")} ${proficiencyBonus}`}>
          {proficiencyBonus >= 0 ? `+${proficiencyBonus}` : `${proficiencyBonus}`}
        </p>
      </GeneralTile>

      <GeneralTile
        headingId="passive-perception-heading"
        title={t("passivePerception")}
        accentColor={accentColor}
        className={SLOTS.tile}>
        <p
          className="text-xl sm:text-2xl font-bold tabular-nums"
          aria-label={`${t("passivePerception")} : ${player?.stats?.passivePerception}`}>
          {player?.stats?.passivePerception}
        </p>
      </GeneralTile>

      <GeneralTile
        headingId="inspiration-heading"
        title={t("inspiration")}
        accentColor={accentColor}
        className={SLOTS.tile}>
        {isInSession ? (
          player.inspiration ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-auto min-h-8 w-full whitespace-normal"
              disabled={isInspirationLoading}
              onClick={async () => {
                if (!onCharacterUpdate) return;
                setIsInspirationLoading(true);
                try {
                  const updated = (await CharacterService.updateCharacter("players", player._id, {
                    inspiration: false,
                  })) as Player;
                  onCharacterUpdate(updated);
                } catch {
                  toast.error(t("inspirationUseError"), { toastId: "inspiration-error" });
                } finally {
                  setIsInspirationLoading(false);
                }
              }}>
              {t("inspirationUseButton")}
            </Button>
          ) : (
            <span className="text-base sm:text-lg font-semibold text-muted-foreground">{t("inspirationInactive")}</span>
          )
        ) : (
          <p
            className="text-base sm:text-lg font-semibold"
            aria-label={`${t("inspiration")} : ${player.inspiration ? t("inspirationActive") : t("inspirationInactive")}`}>
            {player.inspiration ? t("inspirationActive") : t("inspirationInactive")}
          </p>
        )}
      </GeneralTile>

      <GeneralTile
        headingId="exhaustion-heading"
        title={t("exhaustion")}
        accentColor={accentColor}
        className={SLOTS.tile}>
        <InfoTooltip
          content={infoExhaustionLevel(player.exhaustionLevel)}
          side="top"
          moreInfoLabel={infoExhaustionLevel(player.exhaustionLevel)}>
          <span
            className="text-xl sm:text-2xl font-bold tabular-nums cursor-help focus:outline-none focus:ring-1 focus:ring-offset-2 rounded"
            aria-label={`${t("exhaustionLevel")} ${player.exhaustionLevel}`}>
            {player.exhaustionLevel}
          </span>
        </InfoTooltip>
      </GeneralTile>

      <AbilityScores
        character={player}
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

      <GeneralTile
        headingId="alignment-heading"
        title={tPlayer("alignment")}
        accentColor={accentColor}
        className={SLOTS.sideTile}>
        <p
          className="text-base sm:text-lg font-semibold"
          aria-label={`${tPlayer("alignment")} : ${tAlignment(player?.profile?.alignment)}`}>
          {tAlignment(player?.profile?.alignment)}
        </p>
      </GeneralTile>

      <GeneralTile
        headingId="background-heading"
        title={t("background")}
        accentColor={accentColor}
        className={SLOTS.sideTile}>
        <p
          className="text-base sm:text-lg font-semibold whitespace-pre-wrap wrap-break-word"
          aria-label={`${t("background")} : ${player?.profile?.history}`}>
          {player?.profile?.history}
        </p>
      </GeneralTile>

      <GeneralSectionCard
        headingId="skills-heading"
        title={t("skills")}
        accentColor={accentColor}
        className={SLOTS.skills}>
        <Skills
          accentColor={accentColor}
          stats={player?.stats}
        />
      </GeneralSectionCard>

      <GeneralSectionCard
        headingId="proficiencies-heading"
        title={t("proficiencies")}
        accentColor={accentColor}
        className={SLOTS.proficiencies}>
        <dl className="flex flex-1 flex-col justify-between gap-2">
          <div className="flex flex-col">
            <dt className="text-sm sm:text-base font-semibold">{t("languages")} :</dt>
            <dd className="text-sm sm:text-base wrap-break-word">{player?.stats?.languages.join(", ")}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm sm:text-base font-semibold">{t("senses")} :</dt>
            <dd>
              <SensesSection
                senses={player?.stats?.senses}
                accentColor={accentColor}
                embedded
              />
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-sm sm:text-base font-semibold">{t("tools")} :</dt>
            <dd className="text-sm sm:text-base wrap-break-word">{player?.stats?.tools.join(", ")}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-sm sm:text-base font-semibold">{t("weapons")} :</dt>
            <dd className="text-sm sm:text-base wrap-break-word">{player?.stats?.weapons.join(", ")}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-sm sm:text-base font-semibold">{t("armors")} :</dt>
            <dd className="text-sm sm:text-base wrap-break-word">{player?.stats?.armors.join(", ")}</dd>
          </div>
        </dl>
      </GeneralSectionCard>

      <AbilitiesSection
        abilities={player.abilities}
        accentColor={accentColor}
        title={t("characterAbilities")}
        headingId="abilities-heading"
        boundedList
        className={`gap-3 ${SLOTS.abilities}`}
        characterId={player._id}
        characterKind="players"
        onAfterAbilityUse={onCharacterUpdate as () => void}
      />
    </div>
  );
}
