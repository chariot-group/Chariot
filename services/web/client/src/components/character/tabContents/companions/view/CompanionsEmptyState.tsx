"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PawPrint, RefreshCw, Users } from "lucide-react";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import { COMPANIONS_SLOTS } from "@/components/character/tabContents/companions/shared/companionsBentoLayout";

interface CompanionsEmptyStateProps {
  /** Liaison buttons (link / create-linked); omitted for the session GM (list + navigation only). */
  actions?: ReactNode;
}

/**
 * Empty Companions tab: two bento cards (explanation with the liaison actions, examples).
 * Rendered as direct children of the Companions grid.
 * @see FR-npc-player-link
 */
export function CompanionsEmptyState({ actions }: CompanionsEmptyStateProps) {
  const t = useTranslations("characterDetail.companions");
  const examples = [
    { key: "familiar", icon: PawPrint, label: t("emptyExampleFamiliar") },
    { key: "wildShape", icon: RefreshCw, label: t("emptyExampleWildShape") },
    { key: "secondaryNpc", icon: Users, label: t("emptyExampleSecondaryNpc") },
  ];

  return (
    <>
      <GeneralSectionCard
        headingId="companions-empty-title"
        title={t("emptyTitle")}
        accentColor="text-primary-light"
        className={COMPANIONS_SLOTS.emptyIntro}>
        <p className="text-sm md:text-base text-white/80">{t("emptyDescription")}</p>
        {actions ? <div className="mt-auto flex flex-nowrap justify-end gap-2 pt-1">{actions}</div> : null}
      </GeneralSectionCard>

      <GeneralSectionCard
        headingId="companions-examples-title"
        title={t("emptyExamplesTitle")}
        accentColor="text-primary-light"
        className={COMPANIONS_SLOTS.emptyExamples}>
        <ul className="grid flex-1 auto-rows-fr gap-3">
          {examples.map(({ key, icon: Icon, label }) => (
            <li
              key={key}
              className="flex items-center gap-3 text-sm text-white/85">
              <Icon
                className="size-5 shrink-0 text-white/70"
                aria-hidden="true"
              />
              <span className="min-w-0 wrap-break-word">{label}</span>
            </li>
          ))}
        </ul>
      </GeneralSectionCard>
    </>
  );
}
