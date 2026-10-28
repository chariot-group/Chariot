"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectCollapsedCompanionNestPlayerIds,
  setCompanionNestCollapsed,
} from "@/store/slices/sidebarSlice";
import { SidebarItemWithActions } from "@/components/layout/Sidebar/shared/SidebarItemWithActions";
import type { SidebarActionItem } from "@/components/layout/Sidebar/shared/sidebarActions.types";

export interface SidebarCompanionNestProps {
  /** Stable id for persistence (Player character id). */
  nestId: string;
  playerName: string;
  companionCharacterIds: string[];
  selectedCharacterId: string | null;
  /** Player row selected (white header), same as group row selection on child sheets. */
  headerSelected?: boolean;
  /** Purple rail under Player-space Mes personnages (FR-npc-player-link). */
  companionRail?: boolean;
  rowBody: (state: { isOpen: boolean }) => ReactNode;
  children: ReactNode;
  actions?: SidebarActionItem[];
  actionsDisabled?: boolean;
  contextMenuLabel?: string;
  overflowTriggerClassName?: string;
  itemClassName?: string;
}

/**
 * Collapsible wrapper for nested linked NPC rows — header aligned with GM `GroupList`.
 * @see FR-sidebar-linked-npc-nesting-collapse
 */
export function SidebarCompanionNest({
  nestId,
  playerName,
  companionCharacterIds,
  selectedCharacterId,
  headerSelected = false,
  companionRail = false,
  rowBody,
  children,
  actions,
  actionsDisabled,
  contextMenuLabel,
  overflowTriggerClassName,
  itemClassName,
}: SidebarCompanionNestProps) {
  const t = useTranslations("sidebar");
  const dispatch = useAppDispatch();
  const collapsedIds = useAppSelector(selectCollapsedCompanionNestPlayerIds);

  if (companionCharacterIds.length === 0) {
    return <>{rowBody({ isOpen: true })}</>;
  }

  const selectedCompanionActive =
    Boolean(selectedCharacterId) && companionCharacterIds.includes(selectedCharacterId!);
  const userCollapsed = collapsedIds.includes(nestId);
  const isOpen = selectedCompanionActive || !userCollapsed;

  const handleOpenChange = (open: boolean) => {
    dispatch(setCompanionNestCollapsed({ playerId: nestId, collapsed: !open }));
  };

  const nestContentId = `companion-nest-${nestId}-content`;

  const rowInterior = (
    <div className="flex w-full min-w-0 items-center gap-2">
      <CollapsibleTrigger
        type="button"
        aria-expanded={isOpen}
        aria-controls={nestContentId}
        aria-label={
          isOpen
            ? t("collapseCompanionsAria", { name: playerName })
            : t("expandCompanionsAria", { name: playerName })
        }
        className="flex shrink-0 cursor-pointer items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50">
        <ChevronRight
          aria-hidden="true"
          className={cn("h-4 w-4 shrink-0 transition-all duration-100", isOpen && "rotate-90")}
        />
      </CollapsibleTrigger>
      <div className="min-w-0 flex-1">{rowBody({ isOpen })}</div>
    </div>
  );

  const hasActions = Boolean(actions?.length && contextMenuLabel);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleOpenChange}>
      <div
        className={cn(
          "flex w-full items-center rounded-[12px] py-2 px-1.5 pl-3",
          headerSelected ? "bg-white text-black" : "bg-card",
        )}>
        {hasActions ? (
          <SidebarItemWithActions
            actions={actions!}
            disabled={actionsDisabled}
            contextMenuLabel={contextMenuLabel!}
            className={cn("min-w-0 flex-1", itemClassName)}
            overflowTriggerClassName={overflowTriggerClassName}>
            {rowInterior}
          </SidebarItemWithActions>
        ) : (
          <div className={cn("min-w-0 flex-1", itemClassName)}>{rowInterior}</div>
        )}
      </div>
      <CollapsibleContent
        id={nestContentId}
        className="mt-1 ml-3 flex flex-col gap-1">
        {companionRail ? (
          <ul
            className="relative flex flex-col gap-1 border-l-2 border-purple pl-2"
            aria-label={t("companionsListLabel", { name: playerName })}>
            {children}
          </ul>
        ) : (
          <ul
            className="relative flex flex-col gap-1"
            aria-label={t("companionsListLabel", { name: playerName })}>
            {children}
          </ul>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
