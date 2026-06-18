"use client";

import * as React from "react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import type { SidebarActionItem } from "@/components/layout/Sidebar/shared/sidebarActions.types";
import { cn } from "@/lib/utils";

const ACTION_BUTTON_WIDTH = 72;
const OPEN_THRESHOLD = 48;
const DRAG_START_THRESHOLD = 10;

type SwipeAxis = "none" | "horizontal" | "vertical";

export interface SidebarItemWithActionsProps {
  rowId: string;
  actions: SidebarActionItem[];
  children: React.ReactNode;
  disabled?: boolean;
  openRowId: string | null;
  onOpenRowIdChange: (rowId: string | null) => void;
  contextMenuLabel: string;
  className?: string;
}

export function SidebarItemWithActions({
  rowId,
  actions,
  children,
  disabled = false,
  openRowId,
  onOpenRowIdChange,
  contextMenuLabel,
  className,
}: SidebarItemWithActionsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dragStartXRef = React.useRef<number | null>(null);
  const dragStartYRef = React.useRef<number | null>(null);
  const dragStartOffsetRef = React.useRef(0);
  const swipeAxisRef = React.useRef<SwipeAxis>("none");
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const maxOffset = actions.length * ACTION_BUTTON_WIDTH;
  const isCommittedOpen = openRowId === rowId;
  const offset =
    isDragging || dragOffset > 0 ? dragOffset : isCommittedOpen ? maxOffset : 0;
  const actionsVisible = offset > 0;

  const clampOffset = React.useCallback(
    (value: number) => Math.max(0, Math.min(maxOffset, value)),
    [maxOffset],
  );

  const resetDragState = React.useCallback(() => {
    dragStartXRef.current = null;
    dragStartYRef.current = null;
    swipeAxisRef.current = "none";
    setIsDragging(false);
  }, []);

  const closeRow = React.useCallback(() => {
    onOpenRowIdChange(null);
    setDragOffset(0);
    resetDragState();
  }, [onOpenRowIdChange, resetDragState]);

  const openRow = React.useCallback(() => {
    onOpenRowIdChange(rowId);
    setDragOffset(0);
    resetDragState();
  }, [onOpenRowIdChange, resetDragState, rowId]);

  React.useEffect(() => {
    if (!isCommittedOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeRow();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [closeRow, isCommittedOpen]);

  React.useEffect(() => {
    if (openRowId !== rowId) {
      setDragOffset(0);
      resetDragState();
    }
  }, [openRowId, resetDragState, rowId]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || actions.length === 0) return;
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("[data-swipe-action]")) return;

    dragStartXRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    dragStartOffsetRef.current = isCommittedOpen ? maxOffset : dragOffset;
    swipeAxisRef.current = "none";
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || dragStartXRef.current === null || dragStartYRef.current === null) return;

    const deltaX = dragStartXRef.current - event.clientX;
    const deltaY = dragStartYRef.current - event.clientY;

    if (swipeAxisRef.current === "none") {
      if (Math.abs(deltaX) < DRAG_START_THRESHOLD && Math.abs(deltaY) < DRAG_START_THRESHOLD) {
        return;
      }

      if (Math.abs(deltaY) >= Math.abs(deltaX)) {
        swipeAxisRef.current = "vertical";
        resetDragState();
        return;
      }

      swipeAxisRef.current = "horizontal";
      setIsDragging(true);
      containerRef.current?.setPointerCapture(event.pointerId);
    }

    if (swipeAxisRef.current !== "horizontal") return;

    event.preventDefault();
    setDragOffset(clampOffset(dragStartOffsetRef.current + deltaX));
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current === null) return;

    if (isDragging && containerRef.current?.hasPointerCapture(event.pointerId)) {
      containerRef.current.releasePointerCapture(event.pointerId);
    }

    if (swipeAxisRef.current === "horizontal") {
      const deltaX = dragStartXRef.current - event.clientX;
      const finalOffset = clampOffset(dragStartOffsetRef.current + deltaX);

      if (finalOffset >= OPEN_THRESHOLD) {
        openRow();
      } else {
        closeRow();
      }
    } else {
      resetDragState();
    }
  };

  const handleActionClick = (action: SidebarActionItem) => {
    closeRow();
    action.onSelect();
  };

  const handleChildClickCapture = (event: React.MouseEvent) => {
    if (isCommittedOpen) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  if (disabled || actions.length === 0) {
    return <div className={className}>{children}</div>;
  }

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (open) closeRow();
      }}>
      <div
        ref={containerRef}
        className={cn("relative overflow-hidden rounded-[12px]", className)}>
        <div
          aria-hidden={!actionsVisible}
          className={cn(
            "absolute inset-y-0 right-0 z-0 flex will-change-transform",
            "transition-[opacity,transform] duration-200 ease-out",
            actionsVisible
              ? "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-4 opacity-0",
          )}
          style={{ width: maxOffset }}>
          {actions.map((action, index) => (
            <button
              key={action.id}
              type="button"
              data-swipe-action={action.id}
              aria-label={action.label}
              tabIndex={actionsVisible ? 0 : -1}
              onClick={() => handleActionClick(action)}
              className={cn(
                "flex h-full shrink-0 cursor-pointer flex-col items-center justify-center px-1.5 text-[11px] font-medium leading-tight text-white",
                "transition-[opacity,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50",
                action.variant === "destructive"
                  ? "bg-red hover:bg-red/90"
                  : "bg-primary hover:bg-primary/90",
                actionsVisible ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0",
              )}
              style={{
                width: ACTION_BUTTON_WIDTH,
                transitionDelay: actionsVisible ? `${index * 40}ms` : "0ms",
              }}>
              {action.icon}
              <span className="mt-0.5 line-clamp-2 text-center">{action.label}</span>
            </button>
          ))}
        </div>

        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "relative z-10 w-full touch-pan-y",
              isDragging ? "transition-none" : "transition-transform duration-200 ease-out",
            )}
            style={{ transform: offset > 0 ? `translateX(-${offset}px)` : undefined }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onClickCapture={handleChildClickCapture}>
            {children}
          </div>
        </ContextMenuTrigger>
      </div>

      <ContextMenuContent
        className="z-[100] w-56 rounded-[12px] bg-card px-1.5 py-1.5 shadow focus-visible:outline-none"
        aria-label={contextMenuLabel}>
        {actions.map((action) => (
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
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const SIDEBAR_SWIPE_ACTION_WIDTH = ACTION_BUTTON_WIDTH;
