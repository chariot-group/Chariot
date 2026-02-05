import { Card } from "@/components/ui/card";
import Image from "next/image";

import NoMastery from "@public/assets/mastery/no-mastery.svg";
import HalfMastery from "@public/assets/mastery/half-mastery.svg";
import Mastery from "@public/assets/mastery/mastery.svg";
import Expert from "@public/assets/mastery/expert.svg";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

interface CompetenceProps {
  competence: string;
  value: number;
  icon?: React.ReactElement | undefined;
  accentColor: string;
  proficiencyBonus?: number | undefined;
  masteriesAbility?: number | undefined;
  skills?: number | undefined;
  tooltip?: string | undefined;
}

export default function Competence({
  competence,
  value,
  icon,
  accentColor,
  proficiencyBonus,
  masteriesAbility,
  skills,
  tooltip,
}: CompetenceProps) {
  const t = useTranslations("characterDetail.player.general");

  function getIconForValue(value: number): string {
    switch (value) {
      case 1:
        return HalfMastery;
      case 2:
        return Mastery;
      case 3:
        return Expert;
      default:
        return NoMastery;
    }
  }

  function calculateModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  function calculateMasteryLevel(masteryLevel: number): string {
    let result: number = 0;
    if (skills!) {
      result = skills;
    } else {
      if (!proficiencyBonus || !masteriesAbility) return "+0";
      let value = calculateModifier(masteriesAbility) + proficiencyBonus * 2;
      if (masteryLevel === 0) value = calculateModifier(masteriesAbility);
      if (masteryLevel === 1) value = calculateModifier(masteriesAbility) + proficiencyBonus / 2;
      if (masteryLevel === 2) value = calculateModifier(masteriesAbility) + proficiencyBonus;
      result = value;
    }
    let arroundedResult = Math.floor(result);
    return arroundedResult > 0 ? `+${arroundedResult}` : `${arroundedResult}`;
  }

  if (tooltip !== undefined) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="p-2">
            <p className={`text-sm flex items-center gap-2 ${value > 0 ? accentColor : ""}`}>
              {icon}
              {competence} <span className="font-bold">{calculateMasteryLevel(value)}</span>
              <Image
                src={getIconForValue(value)}
                alt={t("masteryLevelIcon", { level: value })}
                width={16}
                height={16}
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
        {icon}
        {competence} <span className="font-bold">{calculateMasteryLevel(value)}</span>
        <Image
          src={getIconForValue(value)}
          alt={t("masteryLevelIcon", { level: value })}
          width={16}
          height={16}
          aria-hidden="true"
        />
      </p>
    </Card>
  );
}
