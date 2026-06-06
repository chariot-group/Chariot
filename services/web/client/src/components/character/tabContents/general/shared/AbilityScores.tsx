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
          className="grid grid-cols-2 gap-2"
          role="list"
          aria-label={t("characteristics")}>
          {character?.stats &&
            Object.entries(character?.stats?.abilityScores).map(([key, value]) => {
              const abilityName = t(`abilities.${key}`);
              const modifier = calculateModifier(value);
              return (
                <div
                  key={key}
                  className="p-2"
                  role="listitem">
                  <p
                    className="text-sm flex items-center gap-2"
                    aria-label={`${abilityName} : ${value} (${modifier})`}>
                    <span className="truncate">{abilityName}</span> <span className="italic">{value}</span>{" "}
                    <span className="font-bold">({modifier})</span>
                  </p>
                </div>
              );
            })}
        </div>
      </Card>
    </div>
  );
}
