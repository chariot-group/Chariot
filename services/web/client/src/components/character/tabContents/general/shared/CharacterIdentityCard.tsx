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

const isFilled = (value: ReactNode) => value !== null && value !== undefined && value !== false && value !== "";

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
  const visibleFacts = facts.filter((fact) => isFilled(fact.value));

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
                <dl className="flex flex-wrap gap-x-1.5 text-lg font-bold wrap-break-word sm:text-xl">
                  <div>
                    <dt className="sr-only">{tEdit("firstname")}</dt>
                    <dd>{firstname}</dd>
                  </div>
                  {lastname && (
                    <div>
                      <dt className="sr-only">{tEdit("lastname")}</dt>
                      <dd>{lastname}</dd>
                    </div>
                  )}
                </dl>
                {surname && (
                  <dl>
                    <div>
                      <dt className="sr-only">{tEdit("surname")}</dt>
                      <dd className="text-sm italic text-muted-foreground wrap-break-word sm:text-base">
                        « {surname} »
                      </dd>
                    </div>
                  </dl>
                )}
              </div>
            </div>
            {avatar ? <div className="shrink-0 self-start">{avatar}</div> : null}
          </div>

          {visibleFacts.length > 0 && (
            <dl className={`grid gap-2 ${visibleFacts.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
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
          )}
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
