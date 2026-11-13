import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Bird, Dices, Eye, Footprints, Mountain, RulerIcon, Shield, Shovel, Waves } from "lucide-react";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";
import { FACT_CELL_CLASS, FACT_CELLS_FRAME_CLASS } from "@/components/character/tabContents/shared/factCell";
import { cn } from "@/lib/utils";

type SpeedKey = "walk" | "climb" | "swim" | "fly" | "burrow";

interface StatsSummaryProps {
  armorClass: number;
  initiative: number;
  size: string;
  speed?: Partial<Record<SpeedKey, number>>;
  /** NPC General tab only: 4th key stat cell (FR-character-statistics-card). */
  passivePerception?: number;
}

const SPEEDS: Array<{ key: SpeedKey; tooltipKey: string; Icon: typeof Footprints }> = [
  { key: "walk", tooltipKey: "walkSpeedTooltip", Icon: Footprints },
  { key: "climb", tooltipKey: "climbSpeedTooltip", Icon: Mountain },
  { key: "swim", tooltipKey: "swimSpeedTooltip", Icon: Waves },
  { key: "fly", tooltipKey: "flySpeedTooltip", Icon: Bird },
  { key: "burrow", tooltipKey: "burrowSpeedTooltip", Icon: Shovel },
];

const ICON_CLASS = "size-4 shrink-0 text-muted-foreground sm:size-5";

/** One tinted label/value cell (statistics, spellcasting). */
export function KeyStat({
  label,
  accessibleLabel,
  icon,
  value,
}: {
  label: string;
  accessibleLabel: string;
  icon: ReactNode;
  value: ReactNode;
}) {
  return (
    <div
      className={FACT_CELL_CLASS}
      role="group"
      aria-label={accessibleLabel}>
      <span
        className="truncate text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground"
        aria-hidden="true">
        {label}
      </span>
      <span
        className="flex min-w-0 items-center gap-1.5 text-base font-bold sm:text-lg"
        aria-hidden="true">
        {icon}
        <span className="min-w-0 truncate tabular-nums">{value}</span>
      </span>
    </div>
  );
}

/**
 * Armor class, initiative and size as one row of three equal cells, then speeds as one text line.
 * @see FR-character-statistics-card
 */
export default function StatsSummary({ armorClass, initiative, size, speed, passivePerception }: StatsSummaryProps) {
  const t = useTranslations("characterDetail.battle");
  const { displayFt, unitLabel, secondaryFt, secondaryUnitLabel } = useDistanceUnit();
  const sizeName = t(`sizes.${size}` as Parameters<typeof t>[0]);
  const initiativeText = initiative > 0 ? `+${initiative}` : `${initiative}`;
  const speeds = SPEEDS.filter(({ key }) => (speed?.[key] ?? 0) > 0).map((entry) => {
    const value = speed?.[entry.key] ?? 0;
    const primary = `${displayFt(value)} ${unitLabel}`;
    const secondary = secondaryFt ? `${secondaryFt(value)} ${secondaryUnitLabel}` : null;
    return { ...entry, primary, secondary };
  });

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className={FACT_CELLS_FRAME_CLASS}>
        <div
          className={cn(
            "grid min-w-0 gap-x-4 gap-y-2",
            passivePerception === undefined ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4",
          )}>
          <KeyStat
            label={t("statLabels.armorClass")}
            accessibleLabel={`${t("armorClass")} ${armorClass}`}
            icon={<Shield className={ICON_CLASS} />}
            value={armorClass}
          />
          <KeyStat
            label={t("statLabels.initiative")}
            accessibleLabel={`${t("initiativeTooltip")} ${initiativeText}`}
            icon={<Dices className={ICON_CLASS} />}
            value={initiativeText}
          />
          <KeyStat
            label={t("statLabels.size")}
            accessibleLabel={`${t("sizeTooltip")} ${sizeName}`}
            icon={<RulerIcon className={ICON_CLASS} />}
            value={sizeName}
          />
          {passivePerception !== undefined && (
            <KeyStat
              label={t("statLabels.passivePerception")}
              accessibleLabel={`${t("passivePerception")} ${passivePerception}`}
              icon={<Eye className={ICON_CLASS} />}
              value={passivePerception}
            />
          )}
        </div>
      </div>
      {speeds.length > 0 && (
        <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-sm sm:text-base">
          <span className="font-semibold">{t("statLabels.speeds")} :</span>
          {speeds.map(({ key, tooltipKey, Icon, primary, secondary }, index) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 whitespace-nowrap"
              aria-label={`${t(tooltipKey as Parameters<typeof t>[0])} ${primary}${secondary ? ` (${secondary})` : ""}`}
              role="img">
              {index > 0 && (
                <span
                  className="text-muted-foreground"
                  aria-hidden="true">
                  ·
                </span>
              )}
              <Icon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span
                className="font-semibold tabular-nums"
                aria-hidden="true">
                {primary}
              </span>
              {secondary && (
                <span
                  className="text-xs text-muted-foreground"
                  aria-hidden="true">
                  ({secondary})
                </span>
              )}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
