import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

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

/**
 * One line + ellipsis where hover can reveal the `title`; wraps on touch devices so the full
 * text stays readable without a tooltip (FR-tooltip-accessibility).
 * @see FR-character-identity-card
 */
export const TRUNCATE_ON_HOVER_DEVICES_CLASS = "min-w-0 wrap-break-word [@media(hover:hover)]:truncate";

/** Two columns; an odd last cell spans the row so no empty slot suggests a missing fact. */
export const FACTS_TWO_COLUMNS_CLASS = "grid-cols-2 [&>div:last-child:nth-child(odd)]:col-span-2";

const isFilled = (value: ReactNode) => value !== null && value !== undefined && value !== false && value !== "";

/**
 * Key fact cells of the « Personnage » card (statistics cell style); empty values are not rendered.
 * Reused by the Companions-tab cards. @see FR-character-identity-card, FR-npc-player-link
 */
export function IdentityFactCells({ facts }: { facts: IdentityFact[] }) {
  const visibleFacts = facts.filter((fact) => isFilled(fact.value));
  if (visibleFacts.length === 0) return null;

  return (
    <dl className={`grid gap-2 ${visibleFacts.length > 1 ? FACTS_TWO_COLUMNS_CLASS : "grid-cols-1"}`}>
      {visibleFacts.map((fact) => (
        <div
          key={fact.key}
          className="flex min-w-0 flex-col gap-0.5 rounded-[10px] bg-gray-middle-light/50 px-2.5 py-2">
          <dt className="truncate text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {fact.label}
          </dt>
          <dd className="text-base font-bold wrap-break-word sm:text-lg">{fact.value}</dd>
          {isFilled(fact.secondary) && (
            <dd className="text-xs text-muted-foreground wrap-break-word sm:text-sm">{fact.secondary}</dd>
          )}
        </div>
      ))}
    </dl>
  );
}

/**
 * Read-mode « Personnage » card: name (next to the avatar) → key fact cells → classes, full width.
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
      className={`gap-3 p-4 md:px-6 ${className}`}
      role="region"
      aria-labelledby="character-heading">
      <div className="flex flex-1 flex-col justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <h2
                id="character-heading"
                className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                {t("character")}
              </h2>
              <div className="flex min-w-0 flex-col gap-1">
                <dl
                  title={fullName}
                  className={`text-lg font-bold sm:text-xl ${TRUNCATE_ON_HOVER_DEVICES_CLASS}`}>
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
                </dl>
                {surname && (
                  <dl className="min-w-0">
                    <div>
                      <dt className="sr-only">{tEdit("surname")}</dt>
                      <dd
                        title={`« ${surname} »`}
                        className={`text-sm italic text-muted-foreground sm:text-base ${TRUNCATE_ON_HOVER_DEVICES_CLASS}`}>
                        « {surname} »
                      </dd>
                    </div>
                  </dl>
                )}
              </div>
            </div>
            {avatar ? <div className="shrink-0 self-start">{avatar}</div> : null}
          </div>

          <IdentityFactCells facts={facts} />
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
                  className="flex items-start justify-between gap-2 rounded-[10px] bg-gray-middle-light/50 px-2.5 py-2">
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
