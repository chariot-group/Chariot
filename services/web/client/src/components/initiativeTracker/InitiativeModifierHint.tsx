"use client";

import { Dices } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type InitiativeModifierHintProps = {
  modifierText: string;
  ariaLabel: string;
  className?: string;
};

/**
 * FR-tracker-initiative-modifier-display — bonus fiche (icône dés + valeur signée + tooltip).
 */
export function InitiativeModifierHint({
  modifierText,
  ariaLabel,
  className,
}: InitiativeModifierHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "mb-0.5 inline-flex max-w-full items-center justify-center gap-0.5 rounded-sm text-[10px] font-medium leading-none tabular-nums text-white/55 hover:text-white/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40",
            className,
          )}>
          <Dices
            className="size-2.5 shrink-0"
            aria-hidden="true"
          />
          <span aria-hidden="true">{modifierText}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs text-center">
        {ariaLabel}
      </TooltipContent>
    </Tooltip>
  );
}
