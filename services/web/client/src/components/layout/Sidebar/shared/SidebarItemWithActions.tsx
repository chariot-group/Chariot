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
    return actions.map((action) => (
      <ContextMenuItem
        key={action.id}
        variant={action.variant === "destructive" ? "destructive" : "default"}
        className={cn(
          "cursor-pointer rounded-[8px] px-2 py-1.5 text-sm focus-visible:border",
          action.variant === "destructive" && "text-red-500 hover:text-red-600 focus:text-red-600",
        )}
        onSelect={() => action.onSelect()}>
        {action.label}
      </ContextMenuItem>
    ));
  }

  return actions.map((action) => (
    <DropdownMenuItem
      key={action.id}
      variant={action.variant === "destructive" ? "destructive" : "default"}
      className={cn(
        "cursor-pointer rounded-[8px] px-2 py-1.5 text-sm focus-visible:border",
        action.variant === "destructive" && "text-red-500 hover:text-red-600 focus:text-red-600",
      )}
      onSelect={() => action.onSelect()}>
      {action.label}
    </DropdownMenuItem>
  ));
}

export function SidebarItemWithActions({
  actions,
  children,
  disabled = false,
  contextMenuLabel,
  className,
  overflowTriggerClassName,
  menuContentClassName,
}: SidebarItemWithActionsProps) {
  const showOverflowMenu = useIsTabletOrMobile();

  if (disabled || actions.length === 0) {
    return <div className={className}>{children}</div>;
  }

  if (showOverflowMenu) {
    return (
      <div className={cn("flex min-w-0 items-stretch", className)}>
        <div className="flex min-w-0 flex-1 items-center">
          {children}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={contextMenuLabel}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                className={cn(
                  "mr-0.5 flex shrink-0 cursor-pointer items-center justify-center self-center rounded-[8px] p-1.5 transition-all duration-100",
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
        </div>
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
