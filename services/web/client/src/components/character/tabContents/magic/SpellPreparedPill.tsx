"use client";

import type { MouseEvent, KeyboardEvent } from "react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface SpellPreparedPillProps {
  /** Indique si le sort est préparé (`spell.prepared === true`). */
  isPrepared: boolean;
  interactive: boolean;
  onToggle?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Limite atteinte : impossible de repasser à préparé depuis non préparé */
  prepareBlocked?: boolean;
  preparedTooltip: string;
  unpreparedTooltip: string;
  prepareBlockedTooltip: string;
  ariaPrepared: string;
  ariaUnprepared: string;
}

/**
 * Pastille de préparation (liste) : point vert / gris en lecture ; en mode édition,
 * petit bouton contour avec coche ou cercle.
 */
export default function SpellPreparedPill({
  isPrepared,
  interactive,
  onToggle,
  prepareBlocked = false,
  preparedTooltip,
  unpreparedTooltip,
  prepareBlockedTooltip,
  ariaPrepared,
  ariaUnprepared,
}: SpellPreparedPillProps) {
  const blocked = prepareBlocked && !isPrepared;

  if (!interactive) {
    const pill = (
      <span
        className={cn(
          "inline-block shrink-0 rounded-full size-2.5",
          isPrepared ? "bg-emerald-500" : "bg-muted-foreground/35",
        )}
        aria-hidden
      />
    );
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex shrink-0 items-center">{pill}</span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{isPrepared ? preparedTooltip : unpreparedTooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const button = (
    <button
      type="button"
      disabled={blocked}
      aria-label={isPrepared ? ariaPrepared : ariaUnprepared}
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full border touch-manipulation transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isPrepared
          ? "border-emerald-500/55 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/35"
          : "border-border/90 bg-background/70 text-muted-foreground hover:bg-muted/50",
        !blocked && "cursor-pointer active:scale-[0.97]",
        blocked && "cursor-not-allowed opacity-45 border-dashed",
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (!blocked) onToggle?.(e);
      }}
      onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
        }
      }}>
      {isPrepared ? (
        <Check className="size-3.5 stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round" aria-hidden />
      ) : (
        <Circle className="size-3.5 stroke-[1.75]" aria-hidden />
      )}
    </button>
  );

  if (blocked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex shrink-0">{button}</span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{prepareBlockedTooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0">{button}</span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{isPrepared ? preparedTooltip : unpreparedTooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
