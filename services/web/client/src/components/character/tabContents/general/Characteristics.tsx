import { Card } from "@/components/ui/card";
import { Character } from "@/types/character";
import { useTranslations } from "next-intl";

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
    <Card className="gap-2 py-3">
      <h2 className={`text-2xl font-semibold ${accentColor}`}>{t("characteristics")}</h2>
      <dl className="flex flex-col gap-2">
        {character?.stats &&
          Object.entries(character?.stats?.abilityScores).map(([key, value]) => (
            <div
              key={key}
              className="flex flex-col sm:flex-row gap-2">
              <dt className="text-sm sm:text-base font-semibold">{t(`abilities.${key}`)}</dt>
              <dd className="text-sm sm:text-base">
                {value} ({calculateModifier(value)})
              </dd>
            </div>
          ))}
      </dl>
    </Card>
  );
}
