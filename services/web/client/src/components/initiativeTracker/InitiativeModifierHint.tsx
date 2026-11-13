"use client";

import { Dices } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type InitiativeModifierHintProps = {
  modifierText: string;
  ariaLabel: string;
  /** FR-combat-initiative-tracker — replaces the bonus by the live calculation once a roll is entered. */
  displayText?: string | null;
  className?: string;
};

/**
 * FR-combat-initiative-tracker — bonus fiche (icône dés + valeur signée + tooltip).
 */
export function InitiativeModifierHint({
  modifierText,
  ariaLabel,
  displayText,
  className,
}: InitiativeModifierHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "mt-1 inline-flex max-w-full items-center justify-center gap-1 whitespace-nowrap rounded-sm text-xs font-medium leading-none tabular-nums text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40",
            className,
          )}>
          {displayText ? null : (
            <Dices
              className="size-3 shrink-0"
              aria-hidden="true"
            />
          )}
          <span aria-hidden="true">{displayText ?? modifierText}</span>
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
