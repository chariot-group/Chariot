import { Card } from "@/components/ui/card";
import Image from "next/image";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";
import { getIconForValue } from "@/utils/global.utils";
import { Stats } from "@/types/character";

import { AbilityScores } from "@/types/character";

interface SavingThrowProps {
  label: string;
  skillName: keyof AbilityScores;
  accentColor: string;
  tooltip?: string | undefined;
  stats: Stats;
}

export default function SavingThrow({ label, skillName, accentColor, tooltip, stats }: SavingThrowProps) {
  const t = useTranslations("characterDetail.player.general");

  const abilityName = t(`abilities.${skillName}`);
  const abilityScore = stats?.abilityScores?.[skillName] ?? 10;
  const savingThrowValue = stats?.savingThrows?.[skillName] ?? 0;
  const abilityModifier = Math.floor((abilityScore - 10) / 2);
  const isProficient = savingThrowValue !== 0;
  const displayBonus = isProficient ? abilityModifier + savingThrowValue : abilityModifier;
  const masteryLevel = isProficient ? 2 : 0;

  if (tooltip !== undefined) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="p-2">
            <div className="text-sm flex items-center gap-2">
              <span className={`truncate ${isProficient && "italic"}`}>{abilityName}</span>{" "}
              <div className="flex flex-row gap-2">
                <span className="font-bold shrink-0">{displayBonus >= 0 ? `+${displayBonus}` : `${displayBonus}`}</span>
                <Image
                  src={getIconForValue(masteryLevel, accentColor)}
                  alt={t("masteryLevelIcon", { level: masteryLevel })}
                  width={20}
                  height={20}
                  className="shrink-0"
                  aria-hidden="true"
                />
              </div>
            </div>
          </Card>
        </TooltipTrigger>
        <TooltipContent role="tooltip">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Card className="p-2">
      <div className="text-sm flex items-center gap-2 justify-between">
        <span className={`truncate ${isProficient && "italic"}`}>{abilityName}</span>{" "}
        <div className="flex flex-row gap-2">
          <span className="font-bold shrink-0">{displayBonus >= 0 ? `+${displayBonus}` : `${displayBonus}`}</span>
          <Image
            src={getIconForValue(masteryLevel, accentColor)}
            alt={t("masteryLevelIcon", { level: masteryLevel })}
            width={20}
            height={20}
            className="shrink-0"
            aria-hidden="true"
          />
        </div>
      </div>
    </Card>
  );
}
