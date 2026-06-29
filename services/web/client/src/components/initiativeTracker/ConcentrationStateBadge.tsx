"use client";

import { AlertTriangle, Info, Pencil, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PendingConcentrationCheck, TrackerConcentration } from "@/store/slices/sessionSlice";

type ConcentrationStateBadgeProps = {
  concentration: TrackerConcentration;
  badgeLabel: string;
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
  const isSelectVariant = variant === "select";
  const hasPendingCheck = pendingCheck != null;
  const isPendingActionable = hasPendingCheck && Boolean(onPendingCheckActivate);
  const badgeText = badgeLabel.trim() || concentration.spellName;
  const accessibleLabel = hasPendingCheck && pendingCheckLabel
    ? `${detailLabel}. ${pendingCheckLabel}`
    : detailLabel;

  const badgeBody = (
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
        className={cn(
          "min-w-0 truncate",
          isSelectVariant && totalBadgeCount > 1 && "md:sr-only lg:not-sr-only",
        )}>
        {badgeText}
      </span>
      {hasPendingCheck && pendingCheckLabel ? (
        <span
          className={cn(
            "shrink-0 rounded-full border border-yellow/40 bg-yellow/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow",
            isSelectVariant && totalBadgeCount > 1 && "md:sr-only lg:inline-flex",
          )}>
          {pendingCheckLabel}
        </span>
      ) : null}
      <ConcentrationDetailButton
        label={badgeText}
        description={accessibleLabel}
      />
      {canEdit ? (
        <>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="size-5 shrink-0 rounded-full text-inherit/80 hover:bg-white/10"
            aria-label={changeLabel}
            onClick={(event) => {
              event.stopPropagation();
              onEdit?.();
            }}>
            <Pencil className="size-3" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="size-5 shrink-0 rounded-full text-inherit/80 hover:bg-red/15 hover:text-red"
            aria-label={dropLabel}
            onClick={(event) => {
              event.stopPropagation();
              onRemove?.();
            }}>
            <X className="size-3" aria-hidden="true" />
          </Button>
        </>
      ) : null}
    </>
  );

  const badgeClassName = cn(
    "inline-flex min-w-0 max-w-full shrink-0 items-center gap-1 rounded-full border py-1 text-xs font-medium",
    isSelectVariant ? "pl-2 pr-1" : "px-2",
    isSelectVariant && totalBadgeCount > 1 && "max-w-full lg:max-w-none",
    isSelectVariant && badgeIndex > 0 && "md:hidden lg:inline-flex",
    hasPendingCheck
      ? "border-yellow/50 bg-yellow/15 text-yellow"
      : "border-pink/40 bg-pink/15 text-pink",
    isPendingActionable && "cursor-pointer transition-colors hover:bg-yellow/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/50",
  );

  if (isPendingActionable) {
    return (
      <button
        type="button"
        className={badgeClassName}
        aria-label={pendingCheckActivateLabel ?? accessibleLabel}
        title={pendingCheckActivateLabel ?? undefined}
        onClick={onPendingCheckActivate}>
        {badgeBody}
      </button>
    );
  }

  return (
    <span
      className={badgeClassName}
      aria-label={accessibleLabel}>
      {badgeBody}
    </span>
  );
}
