"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type ButtonTone } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CircleAlert } from "lucide-react";
import { useHorizontalWheelScroll } from "@/hooks/useHorizontalWheelScroll";

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

/** Domain color of each tab, also the tone of the sheet footer primary button (FR-frontend-button-system). */
export const TAB_COLORS: Record<CharacterTab, Exclude<ButtonTone, "violet">> = {
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useHorizontalWheelScroll(scrollContainerRef);

  return (
    // Scroll container: the rounded frame scrolls with the tabs, so the first and last tabs keep their rounded ends.
    // Hidden scrollbar: touch, trackpad, keyboard focus and the mouse wheel (useHorizontalWheelScroll) still scroll it.
    <div
      ref={scrollContainerRef}
      className="scrollbar-none min-w-0 max-w-full self-start overflow-x-auto overflow-y-hidden overscroll-x-contain">
      <TabsList
        className={cn(
          // Joined button group: one rounded frame, square inner corners, thin dividers
          "w-max shrink-0 flex-row flex-nowrap items-stretch justify-start gap-0 self-start overflow-hidden rounded-[13px] border border-frame bg-card p-0",
          listClassName,
        )}
        role="tablist"
        aria-label={t("tabs.listLabel")}>
        {tabs.map((tab) => {
          const hasError = Boolean(tabsWithErrors?.[tab]);
          const isActive = activeTab === tab;

          return (
            <TabsTrigger
              key={tab}
              value={tab}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab}-content`}
              data-invalid={hasError || undefined}
              className={cn(
                "relative shrink-0 grow-0 flex-none rounded-none border-0 border-l border-frame py-1.5 text-sm sm:text-base font-medium whitespace-nowrap transition-colors first:border-l-0",
                // Keyboard-only focus, drawn inside the button (no white outline on click)
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                isActive
                  ? cn(
                      `bg-${TAB_COLORS[tab]}`,
                      WHITE_TEXT_TABS.includes(tab) ? "text-white" : "text-black",
                    )
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
    </div>
  );
}
