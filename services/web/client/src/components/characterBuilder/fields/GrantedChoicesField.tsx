"use client";

import { useTranslations } from "next-intl";
import { BuilderFieldFrame } from "@/components/characterBuilder/BuilderCard";
import { BuilderFieldMessages } from "@/components/characterBuilder/BuilderFieldMessages";
import { BuilderOptionList } from "@/components/characterBuilder/fields/BuilderOptionList";
import { fieldMessageIds, type BuilderFieldProps } from "@/components/characterBuilder/builderFieldTypes";
import { toggleKey } from "@/lib/characterBuilder/builderAnswers";

/**
 * `grantedChoices`: one card per grant offered on this page, titled by the grant label (« Sous-race »,
 * « Compétences »…) with its owner as secondary text and a counter. A single expected choice is a radio group,
 * several a checkbox group. Obvious choices arrive pre-selected (suggestion).
 * @see FR-ruleset-character-builder — Web builder UI (Fields, Layout)
 */
export function GrantedChoicesField({ field, issues, domId, onGrantAnswer, embedded }: BuilderFieldProps) {
  const t = useTranslations("characterBuilder");
  const grants = field.grants ?? [];
  if (!grants.length) return null;
  // Titles stay distinct (on screen and as region names) even if the ruleset gives two grants the same label.
  const titles = distinctTitles(grants.map((grant) => grant.label ?? field.label));
  return (
    <>
      {grants.map((grant, grantIndex) => {
        // The same grant id can be offered twice on a page (repeatable option): ids and keys use the position / chain.
        const grantDomId = `${domId}-grant-${grantIndex}`;
        const headingId = `${grantDomId}-title`;
        const grantIssues = issues.filter((issue) => issue.grantId === grant.id);
        const multiple = grant.expectedCount !== 1;
        return (
          <BuilderFieldFrame
            key={grant.key}
            embedded={embedded}
            headingId={headingId}
            describedBy={grant.description ? `${grantDomId}-description` : undefined}
            title={titles[grantIndex]}
            subtitle={[
              t("grantFrom", { owner: grant.ownerLabel }),
              t("chooseCount", { count: grant.expectedCount }),
              grant.suggested ? t("suggestedChoice") : null,
            ]
              .filter(Boolean)
              .join(" · ")}
            aside={
              <span aria-label={t("counterLabel", { count: grant.chosen.length, expected: grant.expectedCount })}>
                {t("counter", { count: grant.chosen.length, expected: grant.expectedCount })}
              </span>
            }>
            {grant.description ? (
              <p
                id={`${grantDomId}-description`}
                className="text-sm text-muted-foreground">
                {grant.description}
              </p>
            ) : null}
            <div className="max-h-96 overflow-y-auto p-0.5 pr-1">
              <BuilderOptionList
                name={grantDomId}
                options={grant.options}
                selected={grant.chosen}
                multiple={multiple}
                labelledBy={headingId}
                describedBy={fieldMessageIds(grantDomId, grantIssues)}
                invalid={grantIssues.some((issue) => issue.severity === "error")}
                onChange={(key, checked) =>
                  onGrantAnswer(grant.id, multiple ? toggleKey(grant.chosen, key, checked) : [key])
                }
              />
            </div>
            <BuilderFieldMessages
              domId={grantDomId}
              issues={grantIssues}
              counts={{ count: grant.chosen.length, expected: grant.expectedCount }}
            />
          </BuilderFieldFrame>
        );
      })}
    </>
  );
}

/** Numbers repeated titles: « Arme (1) », « Arme (2) »; unique titles are kept as they are. */
export function distinctTitles(titles: readonly string[]): string[] {
  return titles.map((title, index) => {
    const total = titles.filter((other) => other === title).length;
    if (total < 2) return title;
    const rank = titles.slice(0, index + 1).filter((other) => other === title).length;
    return `${title} (${rank})`;
  });
}
