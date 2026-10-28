"use client";

import { useTranslations } from "next-intl";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CircleAlert } from "lucide-react";

export type CharacterTab = "general" | "battle" | "magic" | "inventory" | "history";

interface CharacterTabsProps {
  activeTab: CharacterTab;
  listClassName?: string;
  triggerClassName?: string;
  tabsWithErrors?: Partial<Record<CharacterTab, boolean>>;
}

export const CHARACTER_TABS: CharacterTab[] = ["general", "battle", "magic", "inventory", "history"];

export const TAB_COLORS: Record<CharacterTab, string> = {
  general: "blue",
  battle: "red",
  magic: "pink",
  inventory: "yellow",
  history: "green",
};

export default function CharacterTabs({ activeTab, listClassName, triggerClassName, tabsWithErrors }: CharacterTabsProps) {
  const t = useTranslations("characterDetail");

  return (
    <TabsList
      className={cn(
        // Joined button group: one rounded frame, square inner corners, thin dividers
        "flex-row flex-nowrap items-stretch justify-start gap-0 self-start overflow-hidden rounded-[13px] border border-frame bg-card p-0",
        listClassName,
      )}
      role="tablist"
      aria-label={t("tabs.general")}>
      {CHARACTER_TABS.map((tab) => {
        const hasError = Boolean(tabsWithErrors?.[tab]);

        return (
          <TabsTrigger
            key={tab}
            value={tab}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`${tab}-content`}
            data-invalid={hasError || undefined}
            className={cn(
              "relative shrink-0 grow-0 flex-none rounded-none border-0 border-l border-frame py-1.5 text-sm sm:text-base font-medium whitespace-nowrap transition-colors first:border-l-0",
              // Keyboard-only focus, drawn inside the button (no white outline on click)
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              activeTab === tab
                ? `bg-${TAB_COLORS[tab]} text-black`
                : "bg-transparent text-white hover:bg-white/10",
              hasError && "ring-2 ring-inset ring-red/80",
              triggerClassName,
            )}>
            <span className="inline-flex items-center gap-1.5">
              {t(`tabs.${tab}`)}
              {hasError ? (
                <span className="inline-flex items-center">
                  <CircleAlert
                    className="size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{t("tabs.containsErrors")}</span>
                </span>
              ) : null}
            </span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
