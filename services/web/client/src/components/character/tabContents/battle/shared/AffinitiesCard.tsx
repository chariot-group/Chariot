import { useTranslations } from "next-intl";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import type { Affinities } from "@/types/character";

interface AffinitiesCardProps {
  affinities: Affinities | undefined;
  headingId: string;
  accentColor: string;
  className?: string;
}

/**
 * Resistances / vulnerabilities / immunities, with an explicit empty state.
 * @see FR-character-battle-bento-layout
 */
export default function AffinitiesCard({ affinities, headingId, accentColor, className }: AffinitiesCardProps) {
  const t = useTranslations("characterDetail.battle");
  const entries = (["resistances", "vulnerabilities", "immunities"] as const)
    .map((key) => ({ key, values: affinities?.[key] ?? [] }))
    .filter(({ values }) => values.length > 0);

  return (
    <GeneralSectionCard
      headingId={headingId}
      title={t("affinities")}
      accentColor={accentColor}
      className={className}>
      {entries.length > 0 ? (
        <dl className="flex flex-1 flex-col justify-evenly gap-1.5">
          {entries.map(({ key, values }) => (
            <div
              key={key}
              className="text-sm sm:text-base wrap-break-word">
              <dt className="inline font-semibold">{t(key)} :</dt> <dd className="inline">{values.join(", ")}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="flex flex-1 items-center text-sm sm:text-base text-muted-foreground">{t("noAffinities")}</p>
      )}
    </GeneralSectionCard>
  );
}
