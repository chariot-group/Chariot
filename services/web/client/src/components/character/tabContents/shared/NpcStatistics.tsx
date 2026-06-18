import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import { Bird, Dices, Mountain, RulerIcon, Shovel, Waves } from "lucide-react";
import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import RunningIcon from "@public/assets/icons/running-icon.svg";
import { NPC } from "@/types/character";
import { useTranslations } from "next-intl";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";
import CharacterHealthBar from "@/components/character/CharacterHealthBar";

interface NpcStatisticsProps {
  npc: NPC;
  accentColor: string;
}

export default function NpcStatistics({ npc, accentColor }: NpcStatisticsProps) {
  const t = useTranslations("characterDetail.battle");
  const { displayFt, unitLabel } = useDistanceUnit();
  const speed = npc.stats.speed ?? { walk: 0, climb: 0, swim: 0, fly: 0, burrow: 0 };

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
      className="gap-3 p-4 md:px-6 h-fit"
      role="region"
      aria-labelledby="stats-heading-npc">
      <h2
        id="stats-heading-npc"
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
              aria-label={`${t("armorClass")} ${npc.stats.armorClass}`}>
              <Image
                src={ShieldIcon}
                alt=""
                aria-hidden="true"
                width={20}
                height={20}
                className="size-5"
              />
              <span aria-hidden="true">{npc.stats.armorClass}</span>
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
              aria-label={`${t("initiativeTooltip")} ${npc.stats.initiative > 0 ? `+${npc.stats.initiative}` : npc.stats.initiative}`}>
              <Dices
                size={30}
                className="text-black shrink-0"
                aria-hidden="true"
              />
              <span aria-hidden="true">
                {npc.stats.initiative > 0 ? `+${npc.stats.initiative}` : npc.stats.initiative}
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
              aria-label={`${t("sizeTooltip")} ${t(`sizes.${npc.stats.size}` as Parameters<typeof t>[0])}`}>
              <RulerIcon
                size={24}
                className="text-black"
                aria-hidden="true"
              />
              <span aria-hidden="true">
                {t(`sizesAbbr.${npc.stats.size}` as Parameters<typeof t>[0])}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>{t(`sizes.${npc.stats.size}` as Parameters<typeof t>[0])}</TooltipContent>
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
                    aria-label={`${t(badge.tooltipKey as Parameters<typeof t>[0])} ${displayFt(badge.value)} ${unitLabel}`}>
                    {badge.icon}
                    <span aria-hidden="true">
                      {displayFt(badge.value)}
                      {unitLabel}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{t(badge.tooltipKey as Parameters<typeof t>[0])}</TooltipContent>
              </Tooltip>
            ),
        )}
      </div>
      <CharacterHealthBar
        currentHP={npc.stats.currentHitPoints}
        maxHP={npc.stats.maxHitPoints}
        tempHP={npc.stats.tempHitPoints}
      />
      <div className="text-lg px-2">
        <span>{t("hitPointsRoll")}</span>
        {npc.hitPointsRoll && <span className="font-bold"> {npc.hitPointsRoll}</span>}
      </div>
    </Card>
  );
}
