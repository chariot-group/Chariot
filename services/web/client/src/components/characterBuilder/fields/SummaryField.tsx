"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { BuilderCard } from "@/components/characterBuilder/BuilderCard";
import type { BuilderFieldProps } from "@/components/characterBuilder/builderFieldTypes";
import { pageRecap } from "@/lib/characterBuilder/summaryRecap";
import type { Player } from "@/types/character";

const ABILITIES = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;

/**
 * `summary`: one card per builder page recalling its answers with a « Modify » button opening the page, then the
 * sheet card computed from the projected `Player` sheet (the form opened next lets the player change everything).
 * @see FR-ruleset-character-builder — Web builder UI (Fields: summary)
 */
export function SummaryField({ evaluation, page: summaryPage, entryLabel, onGoToPage }: BuilderFieldProps) {
  const t = useTranslations("characterBuilder.summary");
  const tAbilities = useTranslations("characterDetail.player.general.abilities");
  const sheet = evaluation.sheet as Partial<Player> & Record<string, unknown>;
  const stats = (sheet.stats ?? {}) as Partial<Player["stats"]> & Record<string, unknown>;
  const scores = (stats.abilityScores ?? {}) as Record<string, number>;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
      {evaluation.pages
        .filter((page) => page.key !== summaryPage.key)
        .map((page) => {
          const rows = pageRecap(page, entryLabel);
          const headingId = `builder-summary-${page.key.replace(/[^A-Za-z0-9_-]/g, "-")}`;
          return (
            <BuilderCard
              key={page.key}
              headingId={headingId}
              title={page.title}
              aside={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={t("modifyPage", { page: page.title })}
                  onClick={() => onGoToPage(page.key)}>
                  <Pencil aria-hidden="true" />
                  {t("modify")}
                </Button>
              }>
              {rows.length ? (
                <dl className="flex flex-col gap-1.5 text-sm">
                  {rows.map((row) => (
                    <div
                      key={row.key}
                      className="grid min-w-0 grid-cols-1 gap-x-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="whitespace-pre-wrap wrap-break-word text-white">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">{t("noAnswer")}</p>
              )}
            </BuilderCard>
          );
        })}

      <BuilderCard
        headingId="builder-summary-sheet"
        title={t("sheet")}>
        <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ABILITIES.map((ability) => (
            <div
              key={ability}
              className="flex min-w-0 flex-col items-center">
              <dt className="truncate text-xs text-muted-foreground">{tAbilities(ability)}</dt>
              <dd className="text-lg font-semibold text-white">{scores[ability] ?? "—"}</dd>
            </div>
          ))}
        </dl>
        <dl className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{t("hitPoints")}</dt>
            <dd className="font-semibold text-white">{String(stats.maxHitPoints ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("armorClass")}</dt>
            <dd className="font-semibold text-white">{String(stats.armorClass ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("proficiencyBonus")}</dt>
            <dd className="font-semibold text-white">{String(stats.proficiencyBonus ?? "—")}</dd>
          </div>
        </dl>
      </BuilderCard>
    </div>
  );
}
