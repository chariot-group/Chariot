import { Card } from "@/components/ui/card";
import { Player } from "@/types/character";
import Image from "next/image";
import { useTranslations } from "next-intl";
import RedCircle from "@public/assets/icons/red-circle.svg";
import WhiteCircle from "@public/assets/icons/white-circle.svg";
import Skill from "@/components/character/tabContents/general/shared/SavingThrow";
import ActionSection from "@/components/character/tabContents/battle/shared/ActionSection";
import AbilitiesSection from "@/components/character/tabContents/shared/AbilitiesSection";
import Statistics from "@/components/character/tabContents/shared/Statistics";

interface Props {
  player: Player;
  accentColor: string;
  onCharacterUpdate?: (updated?: Player) => void;
}

const PlayerBattleTabContent = ({ player, accentColor, onCharacterUpdate }: Props) => {
  const t = useTranslations("characterDetail.battle");

  // Configuration des badges de statistiques

  return (
    <div className="w-full flex flex-col gap-4 items-start">
      <div className="grid grid-cols-4 max-[376px]:grid-cols-1 gap-3 md:gap-4 w-full">
        {/* Statistiques */}
        <Statistics
          player={player}
          accentColor={accentColor}
          onCharacterUpdate={onCharacterUpdate}
        />
        {/* Jet de sauvegarde */}
        <div className="flex flex-col gap-2 col-span-2 2xl:col-span-1">
          <Card
            className="gap-3 p-4 md:px-6 h-fit"
            role="region"
            aria-labelledby="saving-throws-heading">
            <h2
              id="saving-throws-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("savingThrows")}
            </h2>
          </Card>
          <div
            className="grid max-[376px]:grid-cols-2 grid-cols-1 lg:grid-cols-2 gap-2"
            role="list">
            {player?.stats &&
              Object.entries(player?.stats?.savingThrows).map(([key]) => {
                return (
                  <Skill
                    key={key}
                    skillName={key as keyof typeof player.stats.abilityScores}
                    accentColor={accentColor}
                    stats={player?.stats}
                  />
                );
              })}
          </div>
        </div>

        {/* Jets de sauvegarde contre la mort */}
        <Card
          className="gap-3 p-4 md:px-6 h-fit col-span-3 md:col-span-2 lg:col-span-1 items-end"
          role="region"
          aria-labelledby="death-saves-heading">
          <h2
            id="death-saves-heading"
            className={`text-xl sm:text-2xl font-semibold self-start ${accentColor}`}>
            {t("deathSaves")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-2 items-center w-full">
            <span>{t("successes")}</span>
            <div
              className="grid grid-cols-3 gap-1 md:gap-1 w-full md:w-3/4 xl:w-full xl:max-w-45 justify-self-end md:justify-self-start xl:justify-self-end"
              role="status"
              aria-label={`${t("successes")} ${player.deathSaves.successes} ${t("unperformedThrow")}`}>
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
              className="grid grid-cols-3 gap-1 md:gap-2 w-full md:w-3/4 xl:w-full xl:max-w-45 justify-self-end md:justify-self-start xl:justify-self-end"
              role="status"
              aria-label={`${t("failures")} ${player.deathSaves.failures} ${t("unperformedThrow")}`}>
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
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 max-[376px]:grid-cols-1 gap-2 w-full">
        {/* Capacités et traits */}
        <div className="order-2 lg:order-1">
          <AbilitiesSection
            abilities={player.abilities}
            accentColor={accentColor}
            title={t("abilitiesAndTraits")}
            headingId="abilities-traits-heading"
            characterId={player._id}
            characterKind="players"
            onAfterAbilityUse={onCharacterUpdate}
          />
        </div>
        <div className="flex flex-row gap-2 order-1 lg:order-2">
          {/* Actions */}
          <ActionSection
            title={t("actions")}
            actions={player.actions}
            accentColor={accentColor}
          />
        </div>

        <div className="order-3 lg:order-3">
          <Card
            className="gap-3 p-4 md:px-6 h-fit"
            role="region"
            aria-labelledby="battle-affinities-heading-player">
            <h2
              id="battle-affinities-heading-player"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("affinities")}
            </h2>
            <div className="flex flex-col gap-1">
              {player?.affinities?.resistances?.length > 0 && (
                <p className="text-sm sm:text-base wrap-break-word">
                  <span className="font-semibold">{t("resistances")} :</span> {player.affinities.resistances.join(", ")}
                </p>
              )}
              {player?.affinities?.vulnerabilities?.length > 0 && (
                <p className="text-sm sm:text-base wrap-break-word">
                  <span className="font-semibold">{t("vulnerabilities")} :</span> {player.affinities.vulnerabilities.join(", ")}
                </p>
              )}
              {player?.affinities?.immunities?.length > 0 && (
                <p className="text-sm sm:text-base wrap-break-word">
                  <span className="font-semibold">{t("immunities")} :</span> {player.affinities.immunities.join(", ")}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlayerBattleTabContent;
