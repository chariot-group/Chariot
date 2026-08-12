"use client";

import * as React from "react";
import { MoreVertical } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SidebarActionItem } from "@/components/layout/Sidebar/shared/sidebarActions.types";
import { useIsTabletOrMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface SidebarItemWithActionsProps {
  actions: SidebarActionItem[];
  children: React.ReactNode;
  disabled?: boolean;
  contextMenuLabel: string;
  className?: string;
  overflowTriggerClassName?: string;
  menuContentClassName?: string;
  /** Rendered before the trailing overflow control (e.g. primary row actions). */
  trailingBeforeOverflow?: React.ReactNode;
}

const defaultOverflowTriggerClassName =
  "text-white/40 hover:bg-white/20 hover:text-white focus-visible:ring-white/50";

const defaultMenuContentClassName =
  "z-[100] w-56 rounded-[12px] bg-card px-1.5 py-1.5 shadow focus-visible:outline-none";

function SidebarActionMenuItems({
  actions,
  variant,
}: {
  actions: SidebarActionItem[];
  variant: "context" | "dropdown";
}) {
  if (variant === "context") {
    return actions.map((action) => {
      const item = (
        <ContextMenuItem
          disabled={action.disabled}
          variant={action.variant === "destructive" ? "destructive" : "default"}
          className={cn(
            "cursor-pointer rounded-[8px] px-2 py-1.5 text-sm focus-visible:border",
            action.variant === "destructive" && "text-red-500 hover:text-red-600 focus:text-red-600",
            action.disabled && action.disabledTooltip && "data-[disabled]:pointer-events-auto",
          )}
          onSelect={(event) => {
            if (action.disabled) {
              event.preventDefault();
              return;
            }
            action.onSelect();
          }}>
          {action.label}
        </ContextMenuItem>
      );

      if (action.disabled && action.disabledTooltip) {
        return (
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              <div className="w-full">{item}</div>
            </TooltipTrigger>
            <TooltipContent side="left">{action.disabledTooltip}</TooltipContent>
          </Tooltip>
        );
      }

      return <React.Fragment key={action.id}>{item}</React.Fragment>;
    });
  }

  return actions.map((action) => {
    const item = (
      <DropdownMenuItem
        disabled={action.disabled}
        variant={action.variant === "destructive" ? "destructive" : "default"}
        className={cn(
          "cursor-pointer rounded-[8px] px-2 py-1.5 text-sm focus-visible:border",
          action.variant === "destructive" && "text-red-500 hover:text-red-600 focus:text-red-600",
          action.disabled && action.disabledTooltip && "data-[disabled]:pointer-events-auto",
        )}
        onSelect={(event) => {
          if (action.disabled) {
            event.preventDefault();
            return;
          }
          action.onSelect();
        }}>
        {action.label}
      </DropdownMenuItem>
    );

    if (action.disabled && action.disabledTooltip) {
      return (
        <Tooltip key={action.id}>
          <TooltipTrigger asChild>
            <div className="w-full">{item}</div>
          </TooltipTrigger>
          <TooltipContent side="left">{action.disabledTooltip}</TooltipContent>
        </Tooltip>
      );
    }

    return <React.Fragment key={action.id}>{item}</React.Fragment>;
  });
}

function SidebarOverflowDropdown({
  actions,
  contextMenuLabel,
  overflowTriggerClassName,
  menuContentClassName,
}: {
  actions: SidebarActionItem[];
  contextMenuLabel: string;
  overflowTriggerClassName?: string;
  menuContentClassName?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={contextMenuLabel}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          className={cn(
            "flex shrink-0 cursor-pointer items-center justify-center self-center rounded-[8px] p-1.5 transition-all duration-100",
            "focus-visible:outline-none focus-visible:ring-1",
            overflowTriggerClassName ?? defaultOverflowTriggerClassName,
          )}>
          <MoreVertical
            className="h-4 w-4"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={4}
        className={menuContentClassName ?? defaultMenuContentClassName}
        aria-label={contextMenuLabel}>
        <SidebarActionMenuItems
          actions={actions}
          variant="dropdown"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SidebarItemWithActions({
  actions,
  children,
  disabled = false,
  contextMenuLabel,
  className,
  overflowTriggerClassName,
  menuContentClassName,
  trailingBeforeOverflow,
}: SidebarItemWithActionsProps) {
  const showOverflowMenu = useIsTabletOrMobile();
  const hasActions = !disabled && actions.length > 0;

  if (!hasActions) {
    if (trailingBeforeOverflow) {
      return (
        <div className={cn("flex min-w-0 items-center gap-1", className)}>
          <div className="min-w-0 flex-1">{children}</div>
          {trailingBeforeOverflow}
        </div>
      );
    }

    return <div className={className}>{children}</div>;
  }

  if (showOverflowMenu) {
    return (
      <div className={cn("flex min-w-0 items-center gap-1", className)}>
        <div className="min-w-0 flex-1">{children}</div>
        <div className="flex items-center">
          {trailingBeforeOverflow}
          <SidebarOverflowDropdown
            actions={actions}
            contextMenuLabel={contextMenuLabel}
            overflowTriggerClassName={overflowTriggerClassName}
            menuContentClassName={menuContentClassName}
          />
        </div>
      </div>
    );
  }

  if (trailingBeforeOverflow) {
    return (
      <div className={cn("flex min-w-0 items-center gap-1", className)}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="min-w-0 flex-1">{children}</div>
          </ContextMenuTrigger>
          <ContextMenuContent
            className={menuContentClassName ?? defaultMenuContentClassName}
            aria-label={contextMenuLabel}>
            <SidebarActionMenuItems
              actions={actions}
              variant="context"
            />
          </ContextMenuContent>
        </ContextMenu>
        {trailingBeforeOverflow}
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={className}>{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent
        className={menuContentClassName ?? defaultMenuContentClassName}
        aria-label={contextMenuLabel}>
        <SidebarActionMenuItems
          actions={actions}
          variant="context"
        />
      </ContextMenuContent>
    </ContextMenu>
  );
}
