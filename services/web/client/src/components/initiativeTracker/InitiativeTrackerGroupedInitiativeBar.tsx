"use client";

import * as React from "react";
import { Check, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type InitiativeTrackerGroupedInitiativeBarProps = {
  labels: {
    selectedCount: string;
    initiativePlaceholder: string;
    apply: string;
    clearSelection: string;
  };
  canApply: boolean;
  active: boolean;
  onApply: (initiative: number) => void;
  onClearSelection: () => void;
};

export function InitiativeTrackerGroupedInitiativeBar({
  labels,
  canApply,
  active,
  onApply,
  onClearSelection,
}: InitiativeTrackerGroupedInitiativeBarProps) {
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  const handleApply = () => {
    if (!canApply) return;
    const initiative = Number.parseInt(value, 10);
    if (!Number.isFinite(initiative)) return;
    onApply(initiative);
    setValue("");
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
      <span className="min-w-0 text-sm font-medium text-white/85 sm:shrink-0">{labels.selectedCount}</span>
      <div className="flex min-w-0 items-center gap-1.5">
        <div className="w-[88px] shrink-0 max-[360px]:w-[76px]">
          <Input
            ref={inputRef}
            type="number"
            step={1}
            value={value}
            placeholder={labels.initiativePlaceholder}
            aria-label={labels.initiativePlaceholder}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleApply();
              }
            }}
            className="h-9 w-full rounded-[15px] bg-gray-middle-light px-3 pr-7 text-center text-sm font-normal text-white"
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon-sm"
              aria-label={labels.apply}
              onClick={handleApply}
              disabled={!canApply || value.trim() === ""}>
              <Check className="size-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{labels.apply}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={labels.clearSelection}
              className="text-white/70 hover:text-white"
              onClick={onClearSelection}>
              <Eraser className="size-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{labels.clearSelection}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
