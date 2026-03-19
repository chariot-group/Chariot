"use client";

import { useTranslations } from "next-intl";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type CharacterTab = "general" | "battle" | "magic" | "inventory" | "history";

interface CharacterTabsProps {
  activeTab: CharacterTab;
  listClassName?: string;
  triggerClassName?: string;
}

export const CHARACTER_TABS: CharacterTab[] = ["general", "battle", "magic", "inventory", "history"];

export const TAB_COLORS: Record<CharacterTab, string> = {
  general: "blue",
  battle: "red",
  magic: "pink",
  inventory: "yellow",
  history: "green",
};

export default function CharacterTabs({ activeTab, listClassName, triggerClassName }: CharacterTabsProps) {
  const t = useTranslations("characterDetail");

  return (
    <TabsList
      className={cn("bg-transparent gap-1 flex-row justify-start self-start xl:self-end", listClassName)}
      role="tablist"
      aria-label={t("tabs.general")}>
      {CHARACTER_TABS.map((tab) => (
        <TabsTrigger
          key={tab}
          value={tab}
          role="tab"
          aria-selected={activeTab === tab}
          aria-controls={`${tab}-content`}
          className={cn(
            "text-sm sm:text-base font-medium rounded-[13px] transition-all whitespace-nowrap focus:outline-none focus:ring focus:ring-offset-gray-dark focus:ring-white",
            activeTab === tab
              ? `bg-${TAB_COLORS[tab]} ${tab === "battle" ? "text-white" : "text-black"}`
              : "text-white bg-gray hover:bg-gray-middle",
            triggerClassName,
          )}>
          {t(`tabs.${tab}`)}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
