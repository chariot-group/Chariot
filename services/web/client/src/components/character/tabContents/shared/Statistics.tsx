import { Card } from "@/components/ui/card";
import { Player } from "@/types/character";
import { useTranslations } from "next-intl";
import { Bird, Mountain, RulerIcon, Shovel, Waves } from "lucide-react";
import Image from "next/image";
import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import RunningIcon from "@public/assets/icons/running-icon.svg";
import FeatherIcon from "@public/assets/icons/feather-icon.svg";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CharacterHealthBar from "@/components/character/CharacterHealthBar";
import { getHitDiceRemainingForClass } from "@/utils/rest.utils";

interface StatisticsProps {
  player: Player;
  accentColor: string;
}

export default function Statistics({ player, accentColor }: StatisticsProps) {
  const t = useTranslations("characterDetail.battle");
  const tClass = useTranslations("classes");
  const speed = player.stats.speed ?? { walk: 0, climb: 0, swim: 0, fly: 0, burrow: 0 };

  const speedBadges = [
    {
      key: "walk",
      value: speed.walk,
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
      value: speed.climb,
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
      value: speed.swim,
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
      value: speed.fly,
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
      value: speed.burrow,
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

  return (
    <Card
      className="gap-3 p-4 md:px-6 col-span-2 lg:col-span-1 h-fit"
      role="region"
      aria-labelledby="stats-heading">
      <h2
        id="stats-heading"
        className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
        {t("stats")}
      </h2>
      <div className="flex flex-row justify-start gap-2 text-xl font-extrabold flex-wrap">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="bg-white text-black flex flex-row justify-center gap-1 rounded-full p-2 items-center cursor-help focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"
              tabIndex={0}
              role="img"
              aria-label={`${t("armorClass")} ${player.stats.armorClass}`}>
              <Image
                src={ShieldIcon}
                alt=""
                aria-hidden="true"
                className="size-5"
                width={20}
                height={20}
              />
              <span aria-hidden="true">{player.stats.armorClass}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>{t("armorClassTooltip")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="bg-white text-black flex flex-row justify-center gap-1 rounded-full p-2 items-center cursor-help focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"
              tabIndex={0}
              role="img"
              aria-label={`${t("initiativeTooltip")} ${player.stats.initiative > 0 ? `+${player.stats.initiative}` : player.stats.initiative}`}>
              <Image
                src={FeatherIcon}
                alt=""
                aria-hidden="true"
                className="size-5"
                width={20}
                height={20}
              />
              <span aria-hidden="true">
                {player.stats.initiative > 0 ? `+${player.stats.initiative}` : player.stats.initiative}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>{t("initiativeTooltip")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="bg-white text-black flex flex-row justify-center gap-1 rounded-full p-2 items-center cursor-help focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"
              tabIndex={0}
              role="img"
              aria-label={`${t("sizeTooltip")} ${t(`sizes.${player.stats.size}` as Parameters<typeof t>[0])}`}>
              <RulerIcon
                size={24}
                className="text-black"
                aria-hidden="true"
              />
              <span aria-hidden="true">
                {t(`sizesAbbr.${player.stats.size}` as Parameters<typeof t>[0])}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>{t(`sizes.${player.stats.size}` as Parameters<typeof t>[0])}</TooltipContent>
        </Tooltip>
        {speedBadges.map(
          (badge) =>
            badge.value > 0 && (
              <Tooltip key={badge.key}>
                <TooltipTrigger asChild>
                  <div
                    className="bg-white text-black flex flex-row justify-center gap-1 rounded-full p-2 items-center cursor-help focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"
                    tabIndex={0}
                    role="img"
                    aria-label={`${t(badge.tooltipKey as Parameters<typeof t>[0])} ${badge.value} ${t("feet")}`}>
                    {badge.icon}
                    <span aria-hidden="true">
                      {badge.value}
                      {t("feetAbbr")}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{t(badge.tooltipKey as Parameters<typeof t>[0])}</TooltipContent>
              </Tooltip>
            ),
        )}
      </div>
      <CharacterHealthBar
        currentHP={player.stats.currentHitPoints}
        maxHP={player.stats.maxHitPoints}
        tempHP={player.stats.tempHitPoints}
      />
      <div className="text-lg px-2">
        <span>{t("hitDice")}</span>
        {player.class.map((c, i) => {
          const rem = getHitDiceRemainingForClass(c);
          const lvl = Math.max(0, Math.floor(c.level ?? 0));
          return (
            <span key={`${c.name}-${i}`}>
              {i === 0 ? " " : " + "}
              <span className="font-bold">
                {rem}/{lvl}d{c.hitDice}
              </span>
              {` (${tClass(c.name)})`}
            </span>
          );
        })}
      </div>
    </Card>
  );
}
