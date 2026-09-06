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
      className={cn("bg-transparent flex-row flex-nowrap justify-start gap-1 self-start", listClassName)}
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
              "relative shrink-0 grow-0 flex-none text-sm sm:text-base font-medium rounded-[13px] transition-all whitespace-nowrap focus:outline-none focus:ring focus:ring-offset-gray-dark focus:ring-white",
              activeTab === tab
                ? `bg-${TAB_COLORS[tab]} ${tab === "battle" ? "text-white" : "text-black"}`
                : "text-white bg-gray hover:bg-gray-middle",
              hasError && "ring-2 ring-red/80 ring-offset-1 ring-offset-gray-dark",
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
