"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** FR-combat-initiative-tracker — hover delay before the condition help shows. */
export const CONDITION_HELP_DELAY_MS = 500;

type ConditionBadgeHelpProps = {
  /** Badge text (condition or effect name, with its duration). */
  title: string;
  /** Help text; without it the badge stays a plain, non-interactive pill. */
  description?: string | null;
  className?: string;
  children: React.ReactNode;
};

/**
 * FR-combat-initiative-tracker — condition badge that is its own help trigger (no help icon):
 * the help shows after hovering ~0.5 s, on keyboard focus, or when the badge is clicked / tapped
 * (a click toggles it).
 */
export function ConditionBadgeHelp({ title, description, className, children }: ConditionBadgeHelpProps) {
  const [open, setOpen] = React.useState(false);
  const helpText = description?.trim();

  if (!helpText) {
    return (
      <span
        className={className}
        title={title}>
        {children}
      </span>
    );
  }

  return (
    <Tooltip
      open={open}
      onOpenChange={setOpen}
      delayDuration={CONDITION_HELP_DELAY_MS}>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-slot="condition-badge"
          className={cn(
            "cursor-help text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          // Radix closes the tooltip on pointer down / click: handle both here so a click toggles it.
          onPointerDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen((current) => !current);
          }}>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-sm whitespace-pre-line text-left leading-relaxed">
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 block font-normal text-background/90">{helpText}</span>
      </TooltipContent>
    </Tooltip>
  );
}
