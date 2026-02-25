import { Card } from "@/components/ui/card";
import { Player } from "@/types/character";
import { useState } from "react";
import { useTranslations } from "next-intl";
import AbilityScores from "@/components/character/tabContents/general/shared/AbilityScores";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AbilitiesSection from "@/components/character/tabContents/shared/AbilitiesSection";
import { Bird, Mountain, Shovel, Waves } from "lucide-react";
import Column2 from "@/components/character/tabContents/general/view/Column2";
import CharacterHealthBar from "@/components/character/CharacterHealthBar";
import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import FeatherIcon from "@public/assets/icons/feather-icon.svg";
import RunningIcon from "@public/assets/icons/running-icon.svg";
import Image from "next/image";
import Statistics from "@/components/character/tabContents/shared/Statistics";

interface PlayerGeneralTabContentProps {
  player: Player;
  accentColor: string;
}

export default function PlayerGeneralTabContent({ player, accentColor }: PlayerGeneralTabContentProps) {
  const t = useTranslations("characterDetail.player.general");
  const tbattle = useTranslations("characterDetail.battle");
  const tPlayer = useTranslations("characterDetail.player");
  const tAlignment = useTranslations("alignments");
  const tClass = useTranslations("classes");
  const tEdit = useTranslations("characterDetail.edit");

  const [checked, setChecked] = useState<boolean>(player.inspiration);

  const speedBadges = [
    {
      key: "walk",
      value: player.stats.speed.walk,
      icon: (
        <Image
          src={RunningIcon}
          alt=""
          aria-hidden="true"
          className="size-6"
        />
      ),
      tooltipKey: "walkSpeedTooltip",
    },
    {
      key: "climb",
      value: player.stats.speed.climb,
      icon: (
        <Mountain
          size={24}
          className="text-black"
          aria-hidden="true"
        />
      ),
      tooltipKey: "climbSpeedTooltip",
    },
    {
      key: "swim",
      value: player.stats.speed.swim,
      icon: (
        <Waves
          size={24}
          className="text-black"
          aria-hidden="true"
        />
      ),
      tooltipKey: "swimSpeedTooltip",
    },
    {
      key: "fly",
      value: player.stats.speed.fly,
      icon: (
        <Bird
          size={24}
          className="text-black"
          aria-hidden="true"
        />
      ),
      tooltipKey: "flySpeedTooltip",
    },
    {
      key: "burrow",
      value: player.stats.speed.burrow,
      icon: (
        <Shovel
          size={24}
          className="text-black"
          aria-hidden="true"
        />
      ),
      tooltipKey: "burrowSpeedTooltip",
    },
  ];

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
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="character-heading">
            <h2
              id="character-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("character")}
            </h2>
            <dl className="flex flex-col gap-2 justify-between">
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
          </Card>

          {/* Statistiques */}
          <Statistics
            player={player}
            accentColor={accentColor}
          />

          <Column2
            player={player}
            accentColor={accentColor}
            className="flex sm:hidden"
          />

          {/* Caractéristiques */}
          <div>
            <AbilityScores
              character={player}
              accentColor={accentColor}
            />
          </div>

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
        </section>

        {/* Colonne 2 : Bonus, Jets de sauvegarde et Compétences */}
        <Column2
          player={player}
          accentColor={accentColor}
          className="sm:flex hidden"
        />

        {/* Colonne 3 : Alignement, Perception passive, Historique et Aptitudes */}
        <section
          className="flex flex-col gap-2 md:gap-4 sm:col-span-2 lg:col-span-1"
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
