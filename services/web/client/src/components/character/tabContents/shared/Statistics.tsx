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
          className="size-4 sm:size-5"
        />
      ),
      tooltipKey: "walkSpeedTooltip",
    },
    {
      key: "climb",
      value: speed.climb,
      icon: (
        <Mountain
          className="size-4 sm:size-5 text-black"
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
          className="size-4 sm:size-5 text-black"
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
          className="size-4 sm:size-5 text-black"
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
          className="size-4 sm:size-5 text-black"
          aria-hidden="true"
        />
      ),
      tooltipKey: "burrowSpeedTooltip",
    },
  ];

  return (
    <Card
      className="gap-3 p-4 md:px-6 col-span-2 lg:col-span-1 h-fit min-w-0 w-full"
      role="region"
      aria-labelledby="stats-heading">
      <h2
        id="stats-heading"
        className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
        {t("stats")}
      </h2>
      <div className="flex flex-row justify-start gap-1.5 sm:gap-2 flex-wrap">
        {/* CA */}
        <div
          className="bg-white text-black flex flex-row justify-center gap-1 rounded-[15px] px-2 py-1.5 sm:p-2 items-center"
          role="group"
          aria-label={`${t("armorClass")} ${player.stats.armorClass}`}>
          <Image
            src={ShieldIcon}
            alt=""
            aria-hidden="true"
            className="size-4 sm:size-5"
            width={20}
            height={20}
          />
          <span className="text-sm sm:text-base font-extrabold tabular-nums" aria-hidden="true">
            {player.stats.armorClass}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="flex shrink-0 size-3 sm:size-3.5 rounded-full items-center justify-center text-[0.5rem] sm:text-[0.55rem] font-bold text-black/40 hover:text-black/70 bg-black/10 hover:bg-black/20 transition-colors ml-0.5"
                aria-label={t("armorClassTooltip")}>
                ?
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("armorClassTooltip")}</TooltipContent>
          </Tooltip>
        </div>

        {/* Initiative */}
        <div
          className="bg-white text-black flex flex-row justify-center gap-1 rounded-[15px] px-2 py-1.5 sm:p-2 items-center"
          role="group"
          aria-label={`${t("initiativeTooltip")} ${player.stats.initiative > 0 ? `+${player.stats.initiative}` : player.stats.initiative}`}>
          <Dices
            className="size-4 sm:size-5 text-black shrink-0"
            aria-hidden="true"
          />
          <span className="text-sm sm:text-base font-extrabold tabular-nums" aria-hidden="true">
            {player.stats.initiative > 0 ? `+${player.stats.initiative}` : player.stats.initiative}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="flex shrink-0 size-3 sm:size-3.5 rounded-full items-center justify-center text-[0.5rem] sm:text-[0.55rem] font-bold text-black/40 hover:text-black/70 bg-black/10 hover:bg-black/20 transition-colors ml-0.5"
                aria-label={t("initiativeTooltip")}>
                ?
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("initiativeTooltip")}</TooltipContent>
          </Tooltip>
        </div>

        {/* Taille */}
        <div
          className="bg-white text-black flex flex-row justify-center gap-1 rounded-[15px] px-2 py-1.5 sm:p-2 items-center"
          role="group"
          aria-label={`${t("sizeTooltip")} ${t(`sizes.${player.stats.size}` as Parameters<typeof t>[0])}`}>
          <RulerIcon
            className="size-4 sm:size-5 text-black"
            aria-hidden="true"
          />
          <span className="text-sm sm:text-base font-extrabold" aria-hidden="true">
            {t(`sizesAbbr.${player.stats.size}` as Parameters<typeof t>[0])}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="flex shrink-0 size-3 sm:size-3.5 rounded-full items-center justify-center text-[0.5rem] sm:text-[0.55rem] font-bold text-black/40 hover:text-black/70 bg-black/10 hover:bg-black/20 transition-colors ml-0.5"
                aria-label={`${t("sizeTooltip")} : ${t(`sizes.${player.stats.size}` as Parameters<typeof t>[0])}`}>
                ?
              </button>
            </TooltipTrigger>
            <TooltipContent>{t(`sizes.${player.stats.size}` as Parameters<typeof t>[0])}</TooltipContent>
          </Tooltip>
        </div>

        {/* Vitesses */}
        {speedBadges.map(
          (badge) =>
            badge.value > 0 && (
              <div
                key={badge.key}
                className="bg-white text-black flex flex-row justify-center gap-1 rounded-[15px] px-2 py-1.5 sm:p-2 items-center"
                role="group"
                aria-label={`${t(badge.tooltipKey as Parameters<typeof t>[0])} ${displayFt(badge.value)} ${unitLabel}${secondaryFt ? ` (${secondaryFt(badge.value)} ${secondaryUnitLabel})` : ""}`}>
                {badge.icon}
                <span
                  aria-hidden="true"
                  className="text-sm sm:text-base font-extrabold flex items-baseline gap-0.5">
                  <span className="tabular-nums">{displayFt(badge.value)}{unitLabel}</span>
                  {secondaryFt && (
                    <span className="text-[0.7em] text-black/50 font-normal">({secondaryFt(badge.value)}{secondaryUnitLabel})</span>
                  )}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="flex shrink-0 size-3 sm:size-3.5 rounded-full items-center justify-center text-[0.5rem] sm:text-[0.55rem] font-bold text-black/40 hover:text-black/70 bg-black/10 hover:bg-black/20 transition-colors ml-0.5"
                      aria-label={t(badge.tooltipKey as Parameters<typeof t>[0])}>
                      ?
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t(badge.tooltipKey as Parameters<typeof t>[0])}</TooltipContent>
                </Tooltip>
              </div>
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
        <div className="mt-1 border-t border-border/60 px-2 pt-3 flex flex-col items-end gap-1.5 w-full min-w-0">
          {!isInSession && (
            <p className="text-xs text-muted-foreground italic text-right w-full">
              {t("restSessionOnlyNote")}
            </p>
          )}
          {isInSession && (
            <div className="flex flex-row flex-wrap justify-end gap-2 w-full min-w-0">
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
          )}
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
