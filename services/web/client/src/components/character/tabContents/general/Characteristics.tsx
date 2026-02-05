import { Card } from "@/components/ui/card";
import { Character } from "@/types/character";
import { useTranslations } from "next-intl";
import React from "react";

interface CharacteristicsProps {
  character: Character;
  accentColor: string;
}

export default function Characteristics({ character, accentColor }: CharacteristicsProps) {
  const t = useTranslations("characterDetail.player.general");

  function calculateModifier(score: number): string {
    const modifier = Math.floor((score - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  return (
    <React.Fragment>
      <Card
        className="gap-3 py-4 px-4 md:px-6"
        role="region"
        aria-labelledby="characteristics-heading">
        <h2
          id="characteristics-heading"
          className={`text-2xl font-semibold ${accentColor}`}>
          {t("characteristics")}
        </h2>
      </Card>
      <div
        className="grid grid-cols-1 xl:grid-cols-2 gap-2"
        role="list"
        aria-label={t("characteristics")}>
        {character?.stats &&
          Object.entries(character?.stats?.abilityScores).map(([key, value]) => {
            const abilityName = t(`abilities.${key}`);
            const modifier = calculateModifier(value);
            return (
              <Card
                key={key}
                className="p-2"
                role="listitem">
                <p
                  className="text-sm flex items-center gap-2"
                  aria-label={`${abilityName} : ${value} (${modifier})`}>
                  {abilityName} {value} ({modifier})
                </p>
              </Card>
            );
          })}
      </div>
    </React.Fragment>
  );
}
