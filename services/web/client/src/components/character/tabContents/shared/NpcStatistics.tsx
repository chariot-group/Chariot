import { Card } from "@/components/ui/card";
import StatsSummary from "@/components/character/tabContents/shared/StatsSummary";
import { NPC } from "@/types/character";
import { useTranslations } from "next-intl";
import CharacterHealthBar from "@/components/character/CharacterHealthBar";

interface NpcStatisticsProps {
  npc: NPC;
  accentColor: string;
  /** Layout classes; replaces the default `h-fit`. */
  className?: string;
  /** General tab: passive perception as a 4th key stat (FR-character-statistics-card). */
  showPassivePerception?: boolean;
}

export default function NpcStatistics({ npc, accentColor, className, showPassivePerception }: NpcStatisticsProps) {
  const t = useTranslations("characterDetail.battle");

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
    </Card>
  );
}
