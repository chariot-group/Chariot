"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CircleAlert } from "lucide-react";
import { useHorizontalWheelScroll } from "@/hooks/useHorizontalWheelScroll";

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

export default function CharacterTabs({
  activeTab,
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
                activeTab === tab ? `bg-${TAB_COLORS[tab]} text-black` : "bg-transparent text-white hover:bg-white/10",
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
