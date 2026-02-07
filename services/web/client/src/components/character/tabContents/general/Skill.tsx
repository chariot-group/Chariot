import { Card } from "@/components/ui/card";
import Image from "next/image";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";
import { calculateMasteryLevel, getIconForValue } from "@/utils/global.utils";

interface SkillProps {
  skillName: string;
  value: number;
  icon?: React.ReactElement | undefined;
  accentColor: string;
  proficiencyBonus?: number | undefined;
  masteriesAbility?: number | undefined;
  skills?: number | undefined;
  tooltip?: string | undefined;
}

export default function Skill({
  skillName,
  value,
  icon,
  accentColor,
  proficiencyBonus,
  masteriesAbility,
  skills,
  tooltip,
}: SkillProps) {
  const t = useTranslations("characterDetail.player.general");

  function calculateModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  const masteryLevel = calculateMasteryLevel(value, skills!, proficiencyBonus!, masteriesAbility!);

  if (tooltip !== undefined) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="p-2">
            <p className={`text-sm flex items-center gap-2 ${value > 0 ? accentColor : ""}`}>
              <span className="shrink-0">{icon}</span>
              <span className="truncate">{skillName}</span>{" "}
              <span className="font-bold shrink-0">{masteryLevel > 0 ? `+${masteryLevel}` : `${masteryLevel}`}</span>
              <Image
                src={getIconForValue(value, accentColor)}
                alt={t("masteryLevelIcon", { level: value })}
                width={20}
                height={20}
                className="shrink-0"
                aria-hidden="true"
              />
            </p>
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
      <p className={`text-sm flex items-center gap-2 ${value > 0 ? accentColor : ""}`}>
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{skillName}</span>{" "}
        <span className="font-bold shrink-0">{masteryLevel > 0 ? `+${masteryLevel}` : `${masteryLevel}`}</span>
        <Image
          src={getIconForValue(value, accentColor)}
          alt={t("masteryLevelIcon", { level: value })}
          width={20}
          height={20}
          className="shrink-0"
          aria-hidden="true"
        />
      </p>
    </Card>
  );
}
