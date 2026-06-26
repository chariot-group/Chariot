import Image from "next/image";

import { useTranslations } from "next-intl";
import { getIconForValue } from "@/utils/global.utils";
import { Stats } from "@/types/character";
import { AbilityScores } from "@/types/character";

interface SavingThrowProps {
  skillName: keyof AbilityScores;
  accentColor: string;
  tooltip?: string | undefined;
  stats: Stats;
}

export default function SavingThrow({ skillName, accentColor, stats }: SavingThrowProps) {
  const t = useTranslations("characterDetail.player.general");

  const abilityScore = stats?.abilityScores?.[skillName] ?? 10;
  const savingThrowValue = stats?.savingThrows?.[skillName] ?? 0;
  const abilityModifier = Math.floor((abilityScore - 10) / 2);
  const isProficient = savingThrowValue !== 0;
  const displayBonus = isProficient ? abilityModifier + savingThrowValue : abilityModifier;
  const masteryLevel = isProficient ? 2 : 0;

  const abbr = t(`abilitiesAbbr.${skillName}`);
  const fullName = t(`abilities.${skillName}`);
  const bonusStr = displayBonus >= 0 ? `+${displayBonus}` : `${displayBonus}`;

  return (
    <div
      className="flex flex-col items-center gap-0 py-1.5 px-1 rounded-[10px] hover:bg-gray-middle-light/50 transition-colors"
      role="listitem"
      aria-label={`${fullName} : ${bonusStr}`}>
      <span className="flex items-center gap-0.5 mb-1">
        <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground leading-none">
          {abbr}
        </span>
        <Image
          src={getIconForValue(masteryLevel, accentColor)}
          alt={t("masteryLevelIcon", { level: masteryLevel })}
          width={12}
          height={12}
          className="shrink-0"
          aria-hidden="true"
        />
      </span>
      <span className={`text-base font-bold leading-none${isProficient ? " italic" : ""}`}>
        {bonusStr}
      </span>
    </div>
  );
}
