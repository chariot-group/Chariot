"use client";

import * as React from "react";
import { AlertTriangle, Info, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PendingConcentrationCheck, TrackerConcentration } from "@/store/slices/sessionSlice";
import { useConcentrationBadgeCompaction } from "@/components/initiativeTracker/useConcentrationBadgeCompaction";

type ConcentrationStateBadgeProps = {
  concentration: TrackerConcentration;
  badgeLabel: string;
  badgeShort: string;
  detailLabel: string;
  canEdit?: boolean;
  changeLabel: string;
  dropLabel: string;
  pendingCheck?: PendingConcentrationCheck | null;
  pendingCheckLabel?: string | null;
  pendingCheckActivateLabel?: string | null;
  onEdit?: () => void;
  onRemove?: () => void;
  onPendingCheckActivate?: () => void;
  badgeIndex?: number;
  totalBadgeCount?: number;
  variant?: "default" | "select";
};

function ConcentrationDetailButton({ label, description }: { label: string; description: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={description}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          className="inline-flex size-5 shrink-0 cursor-help items-center justify-center rounded-full text-inherit/70 transition-colors hover:bg-white/10">
          <Info
            aria-hidden="true"
            className="size-3.5"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs text-left leading-relaxed">
        <span className="block font-semibold">{label}</span>
        <span className="mt-1 block font-normal text-background/90">{description}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export function ConcentrationStateBadge({
  concentration,
  badgeLabel,
  badgeShort,
  detailLabel,
  canEdit = false,
  changeLabel,
  dropLabel,
  pendingCheck = null,
  pendingCheckLabel = null,
  pendingCheckActivateLabel = null,
  onEdit,
  onRemove,
  onPendingCheckActivate,
  badgeIndex = 0,
  totalBadgeCount = 1,
  variant = "default",
}: ConcentrationStateBadgeProps) {
  const badgeRef = React.useRef<HTMLButtonElement | HTMLSpanElement>(null);
  const isSelectVariant = variant === "select";
  const hasPendingCheck = pendingCheck != null;
  const isPendingActionable = hasPendingCheck && Boolean(onPendingCheckActivate);
  const compaction = useConcentrationBadgeCompaction(badgeRef, {
    canEdit,
    hasPendingCheck,
  });
  const visibleLabel = compaction.labelMode === "full" ? badgeLabel : badgeShort;
  const accessibleLabel = hasPendingCheck && pendingCheckLabel
    ? `${detailLabel}. ${pendingCheckLabel}`
    : detailLabel;
  const tooltipTitle = concentration.spellName.trim()
    ? detailLabel
    : badgeLabel;
  const interactiveAriaLabel = canEdit
    ? `${changeLabel}. ${accessibleLabel}`
    : accessibleLabel;

  const hasNestedActions = compaction.showInfo || compaction.showDrop;

  const badgeMainContent = (
    <>
      {hasPendingCheck ? (
        <AlertTriangle
          aria-hidden="true"
          className="size-3.5 shrink-0"
        />
      ) : (
        <Sparkles
          aria-hidden="true"
          className="size-3.5 shrink-0"
        />
      )}
      <span
        data-concentration-badge-label=""
        className="shrink-0 max-w-full">
        {visibleLabel}
      </span>
      {hasPendingCheck && pendingCheckLabel && compaction.showPendingLabel ? (
        <span
          className={cn(
            "shrink-0 rounded-full border border-yellow-300/60 bg-yellow-500/45 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-50",
            isSelectVariant && totalBadgeCount > 1 && "md:sr-only lg:inline-flex",
          )}>
          {pendingCheckLabel}
        </span>
      ) : null}
    </>
  );

  const badgeActionButtons = (
    <>
      {compaction.showInfo ? (
        <ConcentrationDetailButton
          label={visibleLabel}
          description={accessibleLabel}
        />
      ) : null}
      {compaction.showDrop ? (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="size-5 shrink-0 rounded-full text-inherit/70 hover:bg-red/15 hover:text-red"
          aria-label={dropLabel}
          onClick={(event) => {
            event.stopPropagation();
            onRemove?.();
          }}>
          <X className="size-3" aria-hidden="true" />
        </Button>
      ) : null}
    </>
  );

  const badgeClassName = cn(
    "inline-flex w-max min-w-0 max-w-full shrink-0 items-center gap-1 overflow-hidden rounded-full border py-1 text-xs font-medium",
    compaction.labelMode === "short" && "min-w-[1.75rem] justify-center",
    isSelectVariant ? "pl-2 pr-1" : "px-2",
    isSelectVariant && totalBadgeCount > 1 && "max-w-full lg:max-w-none",
    isSelectVariant && badgeIndex > 0 && "md:hidden lg:inline-flex",
    hasPendingCheck
      ? "border-yellow-300/60 bg-yellow-500/45 text-yellow-50"
      : "border-purple-300/55 bg-purple-500/45 text-purple-50",
    isPendingActionable && "cursor-pointer transition-colors hover:bg-yellow-500/55",
    canEdit && !isPendingActionable && "cursor-pointer transition-colors hover:bg-purple-500/55",
    hasNestedActions
      ? isPendingActionable
        ? "focus-within:outline-none focus-within:ring-2 focus-within:ring-yellow-300/60"
        : "focus-within:outline-none focus-within:ring-2 focus-within:ring-purple-300/55"
      : isPendingActionable
        ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/60"
        : canEdit
          ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/55"
          : null,
  );

  const primaryActionClassName =
    "inline-flex min-w-0 flex-1 items-center gap-1 overflow-hidden border-0 bg-transparent p-0 text-inherit font-inherit cursor-pointer focus-visible:outline-none";

  const badgeShell = (content: React.ReactNode) => (
    <span
      data-concentration-badge-slot=""
      className="inline-block min-w-0 max-w-full w-max">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex min-w-0 max-w-full w-max">{content}</span>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipTitle}</TooltipContent>
      </Tooltip>
    </span>
  );

  if (isPendingActionable) {
    if (hasNestedActions) {
      return badgeShell(
        <span
          ref={badgeRef}
          className={badgeClassName}>
          <button
            type="button"
            className={primaryActionClassName}
            aria-label={pendingCheckActivateLabel ?? interactiveAriaLabel}
            onClick={onPendingCheckActivate}>
            {badgeMainContent}
          </button>
          {badgeActionButtons}
        </span>,
      );
    }

    return badgeShell(
      <button
        ref={badgeRef}
        type="button"
        className={badgeClassName}
        aria-label={pendingCheckActivateLabel ?? interactiveAriaLabel}
        onClick={onPendingCheckActivate}>
        {badgeMainContent}
      </button>,
    );
  }

  if (canEdit) {
    if (hasNestedActions) {
      return badgeShell(
        <span
          ref={badgeRef}
          className={badgeClassName}>
          <button
            type="button"
            className={primaryActionClassName}
            aria-label={interactiveAriaLabel}
            onClick={onEdit}>
            {badgeMainContent}
          </button>
          {badgeActionButtons}
        </span>,
      );
    }

    return badgeShell(
      <button
        ref={badgeRef}
        type="button"
        className={badgeClassName}
        aria-label={interactiveAriaLabel}
        onClick={onEdit}>
        {badgeMainContent}
      </button>,
    );
  }

  return badgeShell(
    <span
      ref={badgeRef}
      className={badgeClassName}
      aria-label={accessibleLabel}>
      {badgeMainContent}
      {badgeActionButtons}
    </span>,
  );
}
