import { Card } from "@/components/ui/card";
import { Player } from "@/types/character";
import { useTranslations } from "next-intl";
import { Bird, Dices, Mountain, RulerIcon, Shovel, Waves } from "lucide-react";
import Image from "next/image";
import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import RunningIcon from "@public/assets/icons/running-icon.svg";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CharacterHealthBar from "@/components/character/CharacterHealthBar";
import { getHitDiceRemainingForClass } from "@/utils/rest.utils";
import { ShortRestButton } from "@/components/character/ShortRestButton";
import { LongRestButton } from "@/components/character/LongRestButton";
import { useAppSelector } from "@/store/hooks";
import { selectIsInSession } from "@/store/slices/sessionSlice";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";
import { useActiveSessionCode } from "@/hooks/useActiveSessionCode";
import { SessionHealthDialog } from "@/components/character/session/SessionHealthDialog";
import { useState } from "react";
import { isPlayer } from "@/utils/global.utils";

interface StatisticsProps {
  player: Player;
  accentColor: string;
  onCharacterUpdate?: (updated?: Player) => void;
}

export default function Statistics({ player, accentColor, onCharacterUpdate }: StatisticsProps) {
  const t = useTranslations("characterDetail.battle");
  const tClass = useTranslations("classes");
  const isInSession = useAppSelector(selectIsInSession);
  const sessionCode = useActiveSessionCode();
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const { displayFt, unitLabel, secondaryFt, secondaryUnitLabel } = useDistanceUnit();
  const speed = player.stats.speed ?? { walk: 0, climb: 0, swim: 0, fly: 0, burrow: 0 };
  const canEditHealthInSession = isInSession && Boolean(onCharacterUpdate);

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
              <Dices
                size={30}
                className="text-black shrink-0"
                aria-hidden="true"
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
                    aria-label={`${t(badge.tooltipKey as Parameters<typeof t>[0])} ${displayFt(badge.value)} ${unitLabel}${secondaryFt ? ` (${secondaryFt(badge.value)} ${secondaryUnitLabel})` : ""}`}>
                    {badge.icon}
                    <span aria-hidden="true" className="flex items-baseline gap-0.5">
                      <span>{displayFt(badge.value)}{unitLabel}</span>
                      {secondaryFt && (
                        <span className="text-[0.75em] text-muted-foreground/60 font-normal">({secondaryFt(badge.value)}{secondaryUnitLabel})</span>
                      )}
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
        interactive={canEditHealthInSession}
        onClick={canEditHealthInSession ? () => setHealthDialogOpen(true) : undefined}
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
      {onCharacterUpdate && (
        <div className="mt-1 border-t border-border/60 px-2 pt-3">
          <div className="flex justify-end">
            <div className="flex flex-wrap gap-2 sm:flex-col xl:flex-row">
              <ShortRestButton
                player={player}
                isInSession={isInSession}
                onApplied={(updated) => onCharacterUpdate(updated)}
                showLabel
              />
              <LongRestButton
                player={player}
                isInSession={isInSession}
                onApplied={(updated) => onCharacterUpdate(updated)}
                showLabel
              />
            </div>
          </div>
        </div>
      )}
      {canEditHealthInSession && onCharacterUpdate ? (
        <SessionHealthDialog
          open={healthDialogOpen}
          onOpenChange={setHealthDialogOpen}
          character={player}
          characterType={isPlayer(player) ? "players" : "npcs"}
          sessionCode={sessionCode}
          onCharacterUpdate={onCharacterUpdate}
        />
      ) : null}
    </Card>
  );
}
