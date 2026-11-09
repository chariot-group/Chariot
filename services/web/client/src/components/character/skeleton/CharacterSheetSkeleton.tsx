"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BENTO_GRID_CLASS,
  GENERAL_BENTO_CONTAINER_CLASS,
  GENERAL_BENTO_GRID_CLASS,
} from "@/components/character/tabContents/general/shared/generalBentoLayout";
import type { CharacterTab } from "@/components/character/characterTabsConfig";
import {
  skeletonCardsForTab,
  type CharacterSheetSkeletonVariant,
  type SkeletonCard,
} from "@/components/character/skeleton/characterSheetSkeletonLayout";
import { cn } from "@/lib/utils";

/** Neutral placeholder bar; static under `prefers-reduced-motion`. */
export const SKELETON_BAR_CLASS = "bg-gray motion-reduce:animate-none";

/** Literal classes (Tailwind scans source text): active tab fill and card heading tint per tab. */
const ACTIVE_TAB_CLASS: Record<CharacterTab, string> = {
  general: "bg-blue",
  battle: "bg-red",
  magic: "bg-pink",
  inventory: "bg-yellow",
  history: "bg-green",
  companions: "bg-purple",
};
const HEADING_TINT_CLASS: Record<CharacterTab, string> = {
  general: "bg-blue/25",
  battle: "bg-red/25",
  magic: "bg-pink/25",
  inventory: "bg-yellow/25",
  history: "bg-green/25",
  companions: "bg-purple/40",
};

/** Label widths, so the fake tabs and lines do not look like a repeated stamp. */
const TAB_LABEL_WIDTHS = ["w-14", "w-14", "w-12", "w-16", "w-14", "w-20"];
const LINE_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/6", "w-3/5"];

/** Rounded placeholder bar (text line, label, pill). */
export function SkeletonBar({ className }: { className?: string }) {
  return <Skeleton className={cn(SKELETON_BAR_CLASS, "rounded-full", className)} />;
}

function SkeletonTabBar({ tabs, activeTab }: Pick<CharacterSheetSkeletonVariant, "tabs" | "activeTab">) {
  return (
    <div className="min-w-0 max-w-full self-start overflow-hidden">
      <div className="flex w-max flex-row overflow-hidden rounded-[13px] border-[0.5px] border-frame bg-card">
        {tabs.map((tab, index) => (
          <div
            key={tab}
            className={cn(
              "flex items-center border-l-[0.5px] border-frame px-5 py-1.5 first:border-l-0",
              tab === activeTab && ACTIVE_TAB_CLASS[tab],
            )}>
            <SkeletonBar
              className={cn(
                "h-4 sm:h-5",
                TAB_LABEL_WIDTHS[index % TAB_LABEL_WIDTHS.length],
                tab === activeTab && "bg-black/25",
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonCardBody({ card }: { card: SkeletonCard }) {
  const { body } = card;

  switch (body.type) {
    case "tile":
      return <SkeletonBar className="mt-auto h-7 w-16" />;
    case "cells":
      return (
        <div
          className={cn(
            "grid flex-1 content-evenly gap-2",
            body.columns === 2 && "grid-cols-2",
            body.columns === 3 && "grid-cols-3",
            body.columns === 5 && "grid-cols-5",
          )}>
          {Array.from({ length: body.count }, (_, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2 rounded-[10px] bg-gray-middle-light/50 px-2 py-3">
              <SkeletonBar className="h-3 w-3/5" />
              <SkeletonBar className="h-5 w-2/5" />
            </div>
          ))}
        </div>
      );
    case "rows":
      return (
        <div className="flex flex-col">
          {Array.from({ length: body.count }, (_, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 border-b border-white/10 px-2 py-3 last:border-b-0">
              <SkeletonBar className={cn("h-4", LINE_WIDTHS[index % LINE_WIDTHS.length], "max-w-64")} />
              <SkeletonBar className="h-3 w-1/3 max-w-40" />
            </div>
          ))}
        </div>
      );
    case "lines":
      return (
        <div className="flex min-w-0 flex-1 gap-4">
          {card.avatar ? (
            <Skeleton className={cn(SKELETON_BAR_CLASS, "size-24 shrink-0 rounded-[15px] sm:size-28")} />
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
            {Array.from({ length: body.count }, (_, index) => (
              <SkeletonBar
                key={index}
                className={cn("h-4", LINE_WIDTHS[index % LINE_WIDTHS.length])}
              />
            ))}
          </div>
        </div>
      );
  }
}

function SkeletonCardShell({ card, tab }: { card: SkeletonCard; tab: CharacterTab }) {
  const isTile = card.body.type === "tile";

  return (
    <div
      data-skeleton-card={card.key}
      className={cn(
        "flex min-w-0 flex-col rounded-[24px] bg-card shadow-sm",
        isTile ? "min-h-24 gap-3 p-4" : "gap-4 p-4 md:px-6",
        card.slot,
      )}>
      {isTile ? (
        <SkeletonBar className="h-3 w-20" />
      ) : (
        <Skeleton className={cn("h-6 w-32 rounded-full sm:h-7 motion-reduce:animate-none", HEADING_TINT_CLASS[tab])} />
      )}
      <SkeletonCardBody card={card} />
    </div>
  );
}

/** Companions tab placeholders; `showActions` false when liaison actions are disabled (GM in session). */
function SkeletonCompanions({ showActions = true }: { showActions?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {showActions ? (
        <div className="flex flex-wrap gap-2">
          <Skeleton className={cn(SKELETON_BAR_CLASS, "h-9 w-36 rounded-[13px]")} />
          <Skeleton className="h-9 w-40 rounded-[13px] bg-purple/40 motion-reduce:animate-none" />
        </div>
      ) : null}
      <div className="grid w-full min-w-0 grid-cols-1 gap-2 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex min-w-0 items-center gap-3 rounded-[15px] bg-card p-4">
            <Skeleton className={cn(SKELETON_BAR_CLASS, "size-12 shrink-0 rounded-full")} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <SkeletonBar className="h-4 w-2/3" />
              <SkeletonBar className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading state of the Companions tab once the sheet is shown (linked NPCs fetch): same placeholders as the
 * sheet skeleton, never a spinner. @see FR-character-sheet-skeleton
 */
export function CompanionsTabSkeleton({ showActions, label }: { showActions: boolean; label: string }) {
  return (
    <div
      role="status"
      aria-busy="true">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        <SkeletonCompanions showActions={showActions} />
      </div>
    </div>
  );
}

/**
 * Sheet placeholders only (`aria-hidden`, no status region): same frame as `CharacterDetailView`
 * (tab bar, scroll area, footer) and the bento layout of the tab that will open. Also embedded
 * in the authentication skeleton, which owns the status region there (FR-auth-loading-skeleton).
 */
export function CharacterSheetSkeletonFrame({ kind, activeTab, tabs }: CharacterSheetSkeletonVariant) {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="shrink-0">
        <div className="mx-auto sm:px-6 md:px-8 px-2 pb-2">
          <SkeletonTabBar
            tabs={tabs}
            activeTab={activeTab}
          />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden w-full mx-auto px-4 sm:px-6 md:px-8 py-4 pb-4">
        {activeTab === "companions" ? (
          <SkeletonCompanions />
        ) : (
          <div className={GENERAL_BENTO_CONTAINER_CLASS}>
            {/* General follows the width left by the sidebar; other tabs keep the viewport grid */}
            <div className={activeTab === "general" ? GENERAL_BENTO_GRID_CLASS : BENTO_GRID_CLASS}>
              {skeletonCardsForTab(activeTab, kind).map((card) => (
                <SkeletonCardShell
                  key={card.key}
                  card={card}
                  tab={activeTab}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/10 px-4 sm:px-6 md:px-8 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
        <div className="flex w-full justify-end gap-2">
          <Skeleton className={cn(SKELETON_BAR_CLASS, "h-9 w-28 rounded-[13px]")} />
          <Skeleton className={cn(SKELETON_BAR_CLASS, "h-9 w-32 rounded-[13px]")} />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading state of the character sheet, so the page does not jump on load.
 * @see FR-character-sheet-skeleton
 */
export default function CharacterSheetSkeleton(variant: CharacterSheetSkeletonVariant) {
  const t = useTranslations("characterDetail");

  return (
    <div
      role="status"
      aria-busy="true"
      className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <span className="sr-only">{t("loadingSheet")}</span>
      <CharacterSheetSkeletonFrame {...variant} />
    </div>
  );
}
