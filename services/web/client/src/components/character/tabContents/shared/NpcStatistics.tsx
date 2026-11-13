import { Card } from "@/components/ui/card";
import StatsSummary from "@/components/character/tabContents/shared/StatsSummary";
import { NPC, Player } from "@/types/character";
import { useTranslations } from "next-intl";
import CharacterHealthBar from "@/components/character/CharacterHealthBar";
import { LongRestButton } from "@/components/character/LongRestButton";
import { useAppSelector } from "@/store/hooks";
import { selectIsSessionLaunched } from "@/store/slices/sessionSlice";
import { selectContextMode } from "@/store/slices/environmentSlice";
import { selectUser } from "@/store/slices/userSlice";
import { canUseLongRest } from "@/utils/rest.utils";

interface NpcStatisticsProps {
  npc: NPC;
  accentColor: string;
  /** Layout classes; replaces the default `h-fit`. */
  className?: string;
  /** General tab: passive perception as a 4th key stat (FR-character-statistics-card). */
  showPassivePerception?: boolean;
  /** Enables the GM long rest control (FR-character-long-rest). */
  onCharacterUpdate?: (updated?: Player | NPC) => void;
}

export default function NpcStatistics({
  npc,
  accentColor,
  className,
  showPassivePerception,
  onCharacterUpdate,
}: NpcStatisticsProps) {
  const t = useTranslations("characterDetail.battle");
  const isSessionLaunched = useAppSelector(selectIsSessionLaunched);
  const isPlayerSpace = useAppSelector(selectContextMode) === "player";
  const currentUserId = useAppSelector(selectUser)?.keycloakId ?? null;
  /** @see FR-character-long-rest */
  const canLongRest =
    Boolean(onCharacterUpdate) &&
    canUseLongRest({
      isPlayerCharacter: false,
      isSessionLaunched,
      isPlayerSpace,
      isOwnCharacter: currentUserId != null && npc.createdBy === currentUserId,
    });

  return (
    <Card
      className={`gap-3 p-4 md:px-6 ${className ?? "h-fit"}`}
      role="region"
      aria-labelledby="stats-heading-npc">
      <h2
        id="stats-heading-npc"
        className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
        {t("stats")}
      </h2>
      <StatsSummary
        armorClass={npc.stats.armorClass}
        initiative={npc.stats.initiative}
        size={npc.stats.size}
        speed={npc.stats.speed}
        passivePerception={showPassivePerception ? npc.stats.passivePerception : undefined}
      />
      <CharacterHealthBar
        currentHP={npc.stats.currentHitPoints}
        maxHP={npc.stats.maxHitPoints}
        tempHP={npc.stats.tempHitPoints}
      />
      <div className="text-lg px-2">
        <span>{t("hitPointsRoll")}</span>
        {npc.hitPointsRoll && <span className="font-bold"> {npc.hitPointsRoll}</span>}
      </div>
      {canLongRest && onCharacterUpdate && (
        <div className="mt-1 flex w-full min-w-0 justify-end border-t border-border px-2 pt-3">
          <LongRestButton
            character={npc}
            onApplied={(updated) => onCharacterUpdate(updated)}
            showLabel
          />
        </div>
      )}
    </Card>
  );
}
