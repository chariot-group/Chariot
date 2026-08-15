"use client";

import { BadgeCheck, Check, FileBadge } from "lucide-react";
import { useTranslations } from "next-intl";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";

interface CodexIconLegendProps {
  showSelection?: boolean;
  className?: string;
}

export default function CodexIconLegend({ showSelection = false, className }: CodexIconLegendProps) {
  const t = useTranslations("characterDetail.magic.codexLegend");

  return (
    <p
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-snug text-muted-foreground",
        className,
      )}
      aria-label={t("legendLabel")}>
      {showSelection ? (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Check
            className="size-3.5 shrink-0 text-purple"
            aria-hidden="true"
          />
          {t("selection")}
        </span>
      ) : null}
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <BadgeCheck
          className="size-3.5 shrink-0 text-green-600"
          aria-hidden="true"
        />
        {t("chariot")}
      </span>
      <InfoTooltip
        content={t("srdTooltip")}
        side="top"
        moreInfoLabel={t("srdTooltip")}>
        <span className="inline-flex cursor-help items-center gap-1.5 whitespace-nowrap">
          <FileBadge
            className="size-3.5 shrink-0"
            aria-hidden="true"
          />
          {t("srd")}
        </span>
      </InfoTooltip>
    </p>
  );
}
