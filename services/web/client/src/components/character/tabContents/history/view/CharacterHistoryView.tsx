import type { ReactNode } from "react";
import { Character } from "@/types/character";
import { Cake, Eye, PersonStanding, Ruler, Scissors, Weight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import { BENTO_BOUNDED_LIST_CLASS } from "@/components/character/tabContents/general/shared/generalBentoLayout";
import {
  APPEARANCE_DESCRIPTION_FIELD,
  HISTORY_BENTO_GRID_CLASS,
  HISTORY_SUBHEADING_CLASS,
  HISTORY_SLOTS,
  HISTORY_TEXT_FIELDS,
  historyHeadingId,
} from "@/components/character/tabContents/history/shared/historyBentoLayout";
import { cn } from "@/lib/utils";

interface CharacterHistoryViewProps {
  character: Character;
  accentColor: string;
}

/**
 * One appearance field: icon + muted label on top, value below (wraps, never truncated).
 * @see FR-character-history-bento-layout
 */
function AppearanceCell({
  label,
  icon: Icon,
  value,
  accessibleValue,
  emptyLabel,
}: {
  label: string;
  icon: typeof Eye;
  value: ReactNode;
  accessibleValue: string;
  emptyLabel: string;
}) {
  const isEmpty = accessibleValue === "";

  return (
    <div
      className="flex min-w-0 flex-col gap-0.5 rounded-[10px] bg-gray-middle-light/50 px-2.5 py-2"
      role="group"
      aria-label={`${label} : ${isEmpty ? emptyLabel : accessibleValue}`}>
      <span
        className="flex min-w-0 items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground"
        aria-hidden="true">
        <Icon className="size-3.5 shrink-0" />
        <span className="wrap-break-word">{label}</span>
      </span>
      <span
        className={cn(
          "min-w-0 text-sm sm:text-base wrap-break-word",
          isEmpty ? "text-muted-foreground" : "font-semibold",
        )}
        aria-hidden="true">
        {isEmpty ? "—" : value}
      </span>
    </div>
  );
}

/** Height or weight in the preferred unit, with the secondary unit when enabled. */
function measure(
  raw: number | null | undefined,
  display: (value: number) => string | number,
  unit: string,
  secondary: ((value: number) => string | number) | null | undefined,
  secondaryUnit: string | null | undefined,
) {
  if (raw == null) return { node: null, text: "" };
  const primary = `${display(Number(raw))}${unit}`;
  const extra = secondary ? `${secondary(Number(raw))}${secondaryUnit ?? ""}` : null;
  return {
    node: (
      <>
        {primary}
        {extra && <span className="ml-1 text-xs font-normal text-muted-foreground">({extra})</span>}
      </>
    ),
    text: extra ? `${primary} (${extra})` : primary,
  };
}

const text = (value: string | number | null | undefined) => (value == null ? "" : String(value));

/** Free text of a card: bounded (scrolls past a max height) or a muted empty-state line. */
function HistoryText({
  value,
  labelledBy,
  emptyLabel,
}: {
  value?: string | null;
  labelledBy: string;
  emptyLabel: string;
}) {
  if (!value) return <p className="text-sm md:text-base text-muted-foreground">{emptyLabel}</p>;
  return (
    <div
      className={BENTO_BOUNDED_LIST_CLASS}
      role="group"
      aria-labelledby={labelledBy}
      tabIndex={0}>
      <p className="text-sm md:text-base whitespace-pre-wrap wrap-break-word">{value}</p>
    </div>
  );
}

/**
 * History tab, read mode: appearance cells and free-text cards in one bento grid.
 * @see FR-character-history-bento-layout
 */
export default function CharacterHistoryView({ character, accentColor }: CharacterHistoryViewProps) {
  const t = useTranslations("characterDetail.history");
  const tBattle = useTranslations("characterDetail.battle");
  const {
    displayHeight,
    heightLabel,
    secondaryHeight,
    secondaryHeightLabel,
    displayWeight,
    weightLabel,
    secondaryWeight,
    secondaryWeightLabel,
  } = useDistanceUnit();
  const appearance = character?.appearance ?? {};
  const background = character?.background ?? {};
  const size = character?.stats?.size;
  const sizeName = size ? tBattle(`sizes.${size}` as Parameters<typeof tBattle>[0]) : "";

  const height = measure(appearance.height, displayHeight, heightLabel, secondaryHeight, secondaryHeightLabel);
  const weight = measure(appearance.weight, displayWeight, weightLabel, secondaryWeight, secondaryWeightLabel);
  const heightText = [height.text, sizeName].filter(Boolean).join(" · ");

  const cells = [
    { key: "eyes", icon: Eye, value: text(appearance.eyes) },
    { key: "age", icon: Cake, value: text(appearance.age) },
    { key: "skin", icon: PersonStanding, value: text(appearance.skin) },
    {
      key: "height",
      icon: Ruler,
      value: heightText,
      node: (
        <>
          {height.node}
          {sizeName && (
            <span className="font-normal text-muted-foreground">
              {height.node ? " · " : ""}
              {sizeName}
            </span>
          )}
        </>
      ),
    },
    { key: "weight", icon: Weight, value: weight.text, node: weight.node },
    { key: "hair", icon: Scissors, value: text(appearance.hair) },
  ] as const;

  const textValues: Record<(typeof HISTORY_TEXT_FIELDS)[number]["key"], string | null | undefined> = {
    personalityTraits: background.personalityTraits,
    ideals: background.ideals,
    bonds: background.bonds,
    flaws: background.flaws,
    alliesAndOrgs: background.alliesAndOrgs,
    backstory: background.backstory,
  };

  return (
    <div className={HISTORY_BENTO_GRID_CLASS}>
      <GeneralSectionCard
        headingId={historyHeadingId("appearance")}
        title={t("appearance")}
        accentColor={accentColor}
        className={HISTORY_SLOTS.appearance}>
        <div className="grid min-w-0 grid-cols-2 gap-2 @sm:grid-cols-3 @3xl:grid-cols-6">
          {cells.map((cell) => (
            <AppearanceCell
              key={cell.key}
              label={t(cell.key)}
              icon={cell.icon}
              value={"node" in cell ? cell.node : cell.value}
              accessibleValue={cell.value}
              emptyLabel={t("notSpecified")}
            />
          ))}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3
            id={historyHeadingId(APPEARANCE_DESCRIPTION_FIELD.key)}
            className={HISTORY_SUBHEADING_CLASS}>
            {t(APPEARANCE_DESCRIPTION_FIELD.key)}
          </h3>
          <HistoryText
            value={appearance.description}
            labelledBy={historyHeadingId(APPEARANCE_DESCRIPTION_FIELD.key)}
            emptyLabel={t("notSpecified")}
          />
        </div>
      </GeneralSectionCard>
      {HISTORY_TEXT_FIELDS.map(({ key, slot }) => {
        const headingId = historyHeadingId(key);
        const value = textValues[key];
        return (
          <GeneralSectionCard
            key={key}
            headingId={headingId}
            title={t(key)}
            accentColor={accentColor}
            className={slot}>
            <HistoryText
              value={value}
              labelledBy={headingId}
              emptyLabel={t("notSpecified")}
            />
          </GeneralSectionCard>
        );
      })}
    </div>
  );
}
