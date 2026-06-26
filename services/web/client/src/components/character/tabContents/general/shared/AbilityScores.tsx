import { Card } from "@/components/ui/card";
import { Character } from "@/types/character";
import { useTranslations } from "next-intl";

interface AbilityScoresProps {
  character: Character;
  accentColor: string;
}

export default function AbilityScores({ character, accentColor }: AbilityScoresProps) {
  const t = useTranslations("characterDetail.player.general");

  function calculateModifier(score: number): string {
    const modifier = Math.floor((score - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  return (
    <div className="flex flex-col gap-2">
      <Card
        className="gap-3 py-4 px-4 md:px-6"
        role="region"
        aria-labelledby="characteristics-heading">
        <h2
          id="characteristics-heading"
          className={`text-2xl font-semibold truncate ${accentColor}`}>
          {t("characteristics")}
        </h2>
        <div
          className="grid grid-cols-3 gap-x-2 gap-y-3"
          role="list"
          aria-label={t("characteristics")}>
          {character?.stats &&
            Object.entries(character?.stats?.abilityScores).map(([key, value]) => {
              const modifier = calculateModifier(value);
              const abbr = t(`abilitiesAbbr.${key}`);
              const fullName = t(`abilities.${key}`);
              return (
                <div
                  key={key}
                  className="flex flex-col items-center gap-0 py-1.5 rounded-[10px] hover:bg-gray-middle-light/50 transition-colors"
                  role="listitem"
                  aria-label={`${fullName} : ${value} (${modifier})`}>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground leading-none mb-1">
                    {abbr}
                  </span>
                  <span className="text-2xl font-bold leading-none">{modifier}</span>
                  <span className="text-xs font-semibold text-muted-foreground leading-none mt-1">
                    {value}
                  </span>
                </div>
              );
            })}
        </div>
      </Card>
    </div>
  );
}
