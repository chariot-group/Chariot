import { Card } from "@/components/ui/card";
import StatsSummary from "@/components/character/tabContents/shared/StatsSummary";
import { NPC, Player } from "@/types/character";
import { useTranslations } from "next-intl";
import CharacterHealthBar from "@/components/character/CharacterHealthBar";
import { canUseLongRest, getHitDiceRemainingForClass } from "@/utils/rest.utils";
import { selectContextMode } from "@/store/slices/environmentSlice";
import { selectUser } from "@/store/slices/userSlice";
import { ShortRestButton } from "@/components/character/ShortRestButton";
import { LongRestButton } from "@/components/character/LongRestButton";
import { useAppSelector } from "@/store/hooks";
import { selectIsSessionLaunched } from "@/store/slices/sessionSlice";
import { useActiveSessionCode } from "@/hooks/useActiveSessionCode";
import { SessionHealthDialog } from "@/components/character/session/SessionHealthDialog";
import { useState } from "react";
import { isPlayer } from "@/utils/global.utils";

interface StatisticsProps {
  player: Player;
  accentColor: string;
  onCharacterUpdate?: (updated?: Player | NPC) => void;
  /** Layout classes; replaces the default battle-tab spans. */
  className?: string;
}

export default function Statistics({ player, accentColor, onCharacterUpdate, className }: StatisticsProps) {
  const t = useTranslations("characterDetail.battle");
  const tClass = useTranslations("classes");
  const isSessionLaunched = useAppSelector(selectIsSessionLaunched);
  const sessionCode = useActiveSessionCode();
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const canEditHealthInSession = isSessionLaunched && Boolean(onCharacterUpdate);
  const isPlayerSpace = useAppSelector(selectContextMode) === "player";
  const currentUserId = useAppSelector(selectUser)?.keycloakId ?? null;
  /** @see FR-character-long-rest */
  const canLongRest = canUseLongRest({
    isPlayerCharacter: true,
    isSessionLaunched,
    isPlayerSpace,
    isOwnCharacter: currentUserId != null && player.createdBy === currentUserId,
  });

  return (
    <Card
      className={`gap-3 p-4 md:px-6 min-w-0 w-full ${className ?? "col-span-2 lg:col-span-1 h-fit"}`}
      role="region"
      aria-labelledby="stats-heading">
      <h2
        id="stats-heading"
        className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
        {t("stats")}
      </h2>
      <StatsSummary
        armorClass={player.stats.armorClass}
        initiative={player.stats.initiative}
        size={player.stats.size}
        speed={player.stats.speed}
      />
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
        <div className="mt-1 border-t border-border px-2 pt-3 flex flex-col items-end gap-1.5 w-full min-w-0">
          {!isSessionLaunched && (
            <p className="text-xs text-muted-foreground italic text-right w-full">
              {canLongRest ? t("shortRestSessionOnlyNote") : t("restSessionOnlyNote")}
            </p>
          )}
          {(isSessionLaunched || canLongRest) && (
            <div className="flex flex-row flex-wrap justify-end gap-2 w-full min-w-0">
              {isSessionLaunched && (
                <ShortRestButton
                  player={player}
                  isInSession={isSessionLaunched}
                  onApplied={(updated) => onCharacterUpdate(updated)}
                  showLabel
                />
              )}
              {canLongRest && (
                <LongRestButton
                  character={player}
                  onApplied={(updated) => onCharacterUpdate(updated)}
                  showLabel
                />
              )}
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
