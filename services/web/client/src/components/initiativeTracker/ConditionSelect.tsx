"use client";

import * as React from "react";
import { Check, Eraser, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { InitiativeTrackerRow } from "@/store/slices/sessionSlice";
import { CONDITIONS } from "./constants";
import { CONDITION_META } from "./conditionMeta";
import type { ActiveInitiativeTrackerCondition } from "./types";
import { clampConditionIndex } from "./utils";

type ConditionSelectProps = {
  row: InitiativeTrackerRow;
  label: string;
  searchPlaceholder: string;
  searchClearLabel: string;
  clearAllConditionsLabel: string;
  emptyText: string;
  getConditionLabel: (condition: ActiveInitiativeTrackerCondition | "none") => string;
  onToggleCondition: (row: InitiativeTrackerRow, condition: ActiveInitiativeTrackerCondition, checked: boolean) => void;
  onClearConditions: (row: InitiativeTrackerRow) => void;
};

export function ConditionSelect({
  row,
  label,
  searchPlaceholder,
  searchClearLabel,
  clearAllConditionsLabel,
  emptyText,
  getConditionLabel,
  onToggleCondition,
  onClearConditions,
}: ConditionSelectProps) {
  const rowConditions = (row.conditions ?? []).filter(
    (condition): condition is ActiveInitiativeTrackerCondition => condition !== "none",
  );
  const [conditionSearch, setConditionSearch] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const optionsRef = React.useRef<HTMLDivElement>(null);

  const filteredConditions = React.useMemo(() => {
    const query = conditionSearch.trim().toLowerCase();
    if (!query) return CONDITIONS;
    return CONDITIONS.filter((condition) => getConditionLabel(condition).toLowerCase().includes(query));
  }, [conditionSearch, getConditionLabel]);
  const activeIndex = clampConditionIndex(highlightedIndex, filteredConditions);

  React.useEffect(() => {
    if (activeIndex < 0) return;
    const highlightedElement = optionsRef.current?.querySelector<HTMLElement>(
      `[data-condition-index="${activeIndex}"]`,
    );
    highlightedElement?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const toggleHighlightedCondition = () => {
    const condition = filteredConditions[activeIndex];
    if (!condition) return;
    onToggleCondition(row, condition, !rowConditions.includes(condition));
  };

  const handleOpenChange = (open: boolean) => {
    setConditionSearch("");
    setHighlightedIndex(0);
    if (open) {
      window.requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => clampConditionIndex(index + 1, filteredConditions));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => clampConditionIndex(index - 1, filteredConditions));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setHighlightedIndex(clampConditionIndex(0, filteredConditions));
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setHighlightedIndex(clampConditionIndex(filteredConditions.length - 1, filteredConditions));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      toggleHighlightedCondition();
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-2 pr-3">
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            className="shrink-0 rounded-full text-white/80 hover:bg-white/10 hover:text-white">
            <Pencil className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-72 border-white/10 bg-card p-3 text-white">
          <div className="mb-2 flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Input
                ref={searchInputRef}
                value={conditionSearch}
                onChange={(event) => {
                  setConditionSearch(event.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                aria-activedescendant={
                  activeIndex >= 0 ? `${row.id}-condition-${filteredConditions[activeIndex]}` : undefined
                }
                aria-controls={`${row.id}-condition-options`}
                aria-expanded="true"
                className={cn("h-8 bg-gray-middle-light text-sm", conditionSearch.length > 0 && "pr-8")}
              />
              {conditionSearch.length > 0 && (
                <button
                  type="button"
                  aria-label={searchClearLabel}
                  onClick={() => {
                    setConditionSearch("");
                    setHighlightedIndex(0);
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex size-5 cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                  <X
                    aria-hidden="true"
                    className="size-3.5"
                  />
                </button>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={rowConditions.length === 0}
                    aria-label={clearAllConditionsLabel}
                    onClick={() => onClearConditions(row)}
                    className="rounded-full text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40">
                    <Eraser className="size-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{clearAllConditionsLabel}</TooltipContent>
            </Tooltip>
          </div>
          <div
            ref={optionsRef}
            id={`${row.id}-condition-options`}
            role="listbox"
            aria-label={label}
            aria-multiselectable="true"
            className="max-h-56 overflow-y-auto pr-1">
            {filteredConditions.length === 0 ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              filteredConditions.map((condition, index) => {
                const isSelected = rowConditions.includes(condition);
                const isHighlighted = index === activeIndex;
                const { Icon, optionClassName } = CONDITION_META[condition];
                return (
                  <button
                    key={condition}
                    id={`${row.id}-condition-${condition}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-condition-index={index}
                    onClick={() => onToggleCondition(row, condition, !isSelected)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "my-0.5 flex w-full cursor-pointer items-center gap-2 rounded-[15px] px-2 py-1.5 text-left text-sm outline-hidden transition-colors",
                      isHighlighted && "bg-white/10",
                      isSelected && "bg-white/12 font-semibold ring-1",
                      optionClassName,
                    )}>
                    <Icon
                      aria-hidden="true"
                      className="size-4 shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate">{getConditionLabel(condition)}</span>
                    {isSelected && (
                      <Check
                        aria-hidden="true"
                        className="size-4 shrink-0 text-white"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
        {rowConditions.length === 0 ? (
          <span className="text-sm text-white/70">{getConditionLabel("none")}</span>
        ) : (
          rowConditions.map((condition) => {
            const { Icon, badgeClassName } = CONDITION_META[condition];
            return (
              <span
                key={condition}
                className={cn(
                  "inline-flex max-w-[132px] items-center gap-1.5 truncate rounded-full border px-2 py-1 text-xs font-medium",
                  badgeClassName,
                )}
                title={getConditionLabel(condition)}>
                <Icon
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                />
                <span className="truncate">{getConditionLabel(condition)}</span>
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}
