"use client";

import { CircleHelp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * « ? » button explaining the dice notation. A click / tap / keyboard popover (not a hover tooltip), so it
 * behaves the same on desktop and touch devices.
 * @see FR-character-list-card
 */
export function DiceHelp() {
  const tEdit = useTranslations("characterDetail.edit");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={tEdit("diceHelpLabel")}>
          <CircleHelp
            className="size-3.5"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="text-sm">
        {tEdit("diceHelp")}
      </PopoverContent>
    </Popover>
  );
}
