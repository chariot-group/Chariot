import { Card } from "@/components/ui/card";
import { Sense } from "@/types/character";
import { useTranslations } from "next-intl";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";

interface SensesSectionProps {
  senses?: Sense[];
  accentColor: string;
  embedded?: boolean;
}

export default function SensesSection({ senses = [], accentColor, embedded = false }: SensesSectionProps) {
  const t = useTranslations("characterDetail.player.general");
  const { displayFt, unitLabel } = useDistanceUnit();
  const hasRange = (value: Sense["value"]) => value !== null && value !== undefined && Number(value) > 0;
  const visibleSenses = senses.filter((sense) => sense.name || hasRange(sense.value));
  const formattedSenses = visibleSenses
    .map((sense) => {
      const name = sense.name || t("unnamedSense");
      return hasRange(sense.value) ? `${name} (${displayFt(Number(sense.value))}${unitLabel})` : name;
    })
    .join(", ");

  const content = visibleSenses.length > 0 ? (
    <span className="text-sm sm:text-base wrap-break-words">{formattedSenses}</span>
  ) : (
    <span className="text-sm sm:text-base text-muted-foreground">{t("noSenses")}</span>
  );

  return embedded ? (
    content
  ) : (
    <Card
      className="gap-3 py-4 px-4 md:px-6"
      role="region"
      aria-labelledby="senses-heading">
      <h2
        id="senses-heading"
        className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
        {t("senses")}
      </h2>
      {content}
    </Card>
  );
}
