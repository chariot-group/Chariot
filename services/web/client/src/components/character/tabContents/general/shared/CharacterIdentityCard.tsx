import { Card } from "@/components/ui/card";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { FACT_CELL_CLASS, FACT_CELLS_FRAME_CLASS } from "@/components/character/tabContents/shared/factCell";
import { cn } from "@/lib/utils";

/** One key fact cell (PC race / level, NPC type). */
export interface IdentityFact {
  key: string;
  label: string;
  value?: ReactNode;
  /** Muted line under the value (subrace, XP, subtype). */
  secondary?: ReactNode;
}

/** One row of the PC classes list. */
export interface IdentityClassItem {
  name: string;
  level: number;
  subclass?: string;
}

interface CharacterIdentityCardProps {
  accentColor: string;
  className?: string;
  avatar?: ReactNode;
  firstname?: string;
  lastname?: string;
  surname?: string;
  /** Cells with an empty value are not rendered. */
  facts: IdentityFact[];
  /** PC only; the block is hidden when empty. */
  classes?: IdentityClassItem[];
}

/** Two columns; an odd last cell spans the row so no empty slot suggests a missing fact. */
/** One column below `@md` card width (mobile); two from `@md` so type / alignment / FP are not squeezed. */
export const FACTS_TWO_COLUMNS_CLASS =
  "grid-cols-1 @md:grid-cols-2 @md:[&>div:last-child:nth-child(odd)]:col-span-2";

/** Identity column beside avatar (sheet + Companions): two columns on typical widths. */
export const FACTS_DENSE_TWO_COLUMNS_CLASS =
  "grid-cols-2 [&>div:last-child:nth-child(odd)]:col-span-2";

/** @deprecated Use FACTS_DENSE_TWO_COLUMNS_CLASS */
export const FACTS_COMPANION_TWO_COLUMNS_CLASS = FACTS_DENSE_TWO_COLUMNS_CLASS;

/** Companions-tab cards only: truncate on hover devices, wrap on touch (the « Personnage » card uses `TruncatedText`). */
export const TRUNCATE_ON_HOVER_DEVICES_CLASS = "min-w-0 wrap-break-word [@media(hover:hover)]:truncate";

const isFilled = (value: ReactNode) => value !== null && value !== undefined && value !== false && value !== "";

/**
 * Key fact cells of the « Personnage » card (statistics cell style); empty values are not rendered.
 * Reused by the Companions-tab cards. @see FR-character-identity-card, FR-npc-player-link
 */
export function IdentityFactCells({
  facts,
  /** Two columns in the narrow column beside the avatar (General « Personnage » + Companions). */
  denseColumns = false,
  /** @deprecated Use denseColumns */
  companionColumns = false,
}: {
  facts: IdentityFact[];
  denseColumns?: boolean;
  companionColumns?: boolean;
}) {
  const useDense = denseColumns || companionColumns;
  const visibleFacts = facts.filter((fact) => isFilled(fact.value));
  if (visibleFacts.length === 0) return null;

  const columnsClass =
    visibleFacts.length <= 1
      ? "grid-cols-1"
      : useDense
        ? FACTS_DENSE_TWO_COLUMNS_CLASS
        : FACTS_TWO_COLUMNS_CLASS;

  return (
    <div className={cn(useDense ? null : "@container", FACT_CELLS_FRAME_CLASS)}>
      <dl
        className={cn(
          "grid gap-y-2",
          useDense ? "gap-x-2 sm:gap-x-3" : "gap-x-4 gap-y-3 @md:gap-y-2",
          columnsClass,
        )}>
        {visibleFacts.map((fact) => (
          <div
            key={fact.key}
            className={FACT_CELL_CLASS}>
            <dt className="truncate text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {fact.label}
            </dt>
            {/* Secondary info on the value line: every cell is two lines, side-by-side cells keep the same height */}
            <dd className="flex min-w-0 flex-col gap-0.5 text-base font-bold wrap-break-word @md:block sm:text-lg">
              <span className="min-w-0 wrap-break-word">{fact.value}</span>
              {isFilled(fact.secondary) && (
                <span className="text-xs font-normal text-muted-foreground wrap-break-word sm:text-sm @md:ml-1 @md:inline @md:font-normal">
                  {fact.secondary}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Read-mode « Personnage » card: name beside avatar; facts full card width; classes below (PC).
 * Name and nickname are clamped to two lines on every screen; the app tooltip shows them in full when cut.
 * @see FR-character-identity-card, FR-character-general-bento-layout
 */
export default function CharacterIdentityCard({
  accentColor,
  className = "",
  avatar,
  firstname,
  lastname,
  surname,
  facts,
  classes = [],
}: CharacterIdentityCardProps) {
  const t = useTranslations("characterDetail.player.general");
  const tEdit = useTranslations("characterDetail.edit");
  const fullName = [firstname, lastname].filter(Boolean).join(" ");

  return (
    <Card
      className={`h-full min-w-0 gap-2 p-4 md:px-6 ${className}`}
      role="region"
      aria-labelledby="character-heading">
      <div className="flex h-full min-h-0 flex-1 flex-col justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2
                id="character-heading"
                className={`text-xl font-semibold sm:text-2xl ${accentColor}`}>
                {t("character")}
              </h2>
              <div className="flex min-w-0 flex-col gap-1">
                <TruncatedText
                  as="dl"
                  lines={2}
                  text={fullName}
                  className="text-lg font-bold sm:text-xl">
                  <div className="inline">
                    <dt className="sr-only">{tEdit("firstname")}</dt>
                    <dd className="inline">{firstname}</dd>
                  </div>
                  {lastname && (
                    <div className="ml-[0.3em] inline">
                      <dt className="sr-only">{tEdit("lastname")}</dt>
                      <dd className="inline">{lastname}</dd>
                    </div>
                  )}
                </TruncatedText>
                <div className="min-h-[1.375rem] sm:min-h-[1.5rem]">
                  {surname ? (
                  <dl className="min-w-0">
                    <div>
                      <dt className="sr-only">{tEdit("surname")}</dt>
                      <TruncatedText
                        as="dd"
                        lines={2}
                        text={`« ${surname} »`}
                        className="text-sm italic text-muted-foreground sm:text-base"
                      />
                    </div>
                  </dl>
                ) : null}
                </div>
              </div>
            </div>
            {avatar ? <div className="shrink-0 self-start">{avatar}</div> : null}
          </div>

          <IdentityFactCells
            facts={facts}
            denseColumns
          />
        </div>

        {classes.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p
              id="character-classes-heading"
              className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("classes")}
            </p>
            <ul
              className="flex flex-col gap-2"
              aria-labelledby="character-classes-heading">
              {classes.map((c) => (
                <li
                  key={c.name}
                  className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold wrap-break-word sm:text-base">{c.name}</p>
                    {c.subclass && (
                      <p className="text-xs text-muted-foreground wrap-break-word sm:text-sm">
                        <span className="sr-only">{`${t("subclassOf")} ${c.name} : `}</span>
                        {c.subclass}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-middle-light px-2 py-0.5 text-xs font-semibold tabular-nums">
                    {t("levelLabel")} {c.level}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
