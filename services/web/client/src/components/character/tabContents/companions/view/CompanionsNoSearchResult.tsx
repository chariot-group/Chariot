"use client";

import { useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { COMPANIONS_SLOTS } from "@/components/character/tabContents/companions/shared/companionsBentoLayout";
import { cn } from "@/lib/utils";

interface CompanionsNoSearchResultProps {
  query: string;
}

/**
 * Full-width band shown when the search matches no companion (clearing stays on the search field).
 * @see FR-npc-player-link — Companions tab search
 */
export function CompanionsNoSearchResult({ query }: CompanionsNoSearchResultProps) {
  const t = useTranslations("characterDetail.companions");

  return (
    <Card className={cn(COMPANIONS_SLOTS.noResults, "flex-row items-center gap-3 p-4 md:px-6")}>
      <SearchX
        className="size-5 shrink-0 text-white/60"
        aria-hidden="true"
      />
      <p className="min-w-0 flex-1 text-sm text-white/80">{t("searchNoResults", { query: query.trim() })}</p>
    </Card>
  );
}
