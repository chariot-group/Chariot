"use client";

import { useTranslations } from "next-intl";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CircleAlert } from "lucide-react";

export const CHARACTER_TABS = ["general", "battle", "magic", "inventory", "history"] as const;
export type BaseCharacterTab = (typeof CHARACTER_TABS)[number];
export type CharacterTab = BaseCharacterTab | "companions";
export const PLAYER_CHARACTER_TABS: CharacterTab[] = [...CHARACTER_TABS, "companions"];

/** @see FR-npc-player-link — Companions tab is Player-space Player sheets, plus session-GM assigned Players. */
export function tabsForCharacterSheet(
  isPlayerCharacter: boolean,
  isPlayerSpace: boolean,
  showSessionGmCompanionsTab = false,
): readonly CharacterTab[] {
  return isPlayerCharacter && (isPlayerSpace || showSessionGmCompanionsTab)
    ? PLAYER_CHARACTER_TABS
    : CHARACTER_TABS;
}

interface CharacterTabsProps {
  activeTab: CharacterTab;
  tabs?: readonly CharacterTab[];
  listClassName?: string;
  triggerClassName?: string;
  tabsWithErrors?: Partial<Record<CharacterTab, boolean>>;
}

export const TAB_COLORS: Record<CharacterTab, string> = {
  general: "blue",
  battle: "red",
  magic: "pink",
  inventory: "yellow",
  history: "green",
  companions: "purple",
};

const WHITE_TEXT_TABS: CharacterTab[] = ["battle", "companions"];

export default function CharacterTabs({
  activeTab,
  tabs = CHARACTER_TABS,
  listClassName,
  triggerClassName,
  tabsWithErrors,
}: CharacterTabsProps) {
  const t = useTranslations("characterDetail");

  return (
    <TabsList
      className={cn("bg-transparent flex-row flex-nowrap justify-start gap-1 self-start", listClassName)}
      role="tablist"
      aria-label={t("tabs.listLabel")}>
      {tabs.map((tab) => {
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
                ? `bg-${TAB_COLORS[tab]} ${WHITE_TEXT_TABS.includes(tab) ? "text-white" : "text-black"}`
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
