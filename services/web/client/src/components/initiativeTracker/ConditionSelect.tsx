"use client";

import * as React from "react";
import { ArrowLeft, Check, Eraser, Info, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  InitiativeTrackerConditionDuration,
  InitiativeTrackerConditionDurationUnit,
  InitiativeTrackerConditionEntry,
  InitiativeTrackerRow,
} from "@/store/slices/sessionSlice";
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
  addBackLabel: string;
  addConfirmLabel: string;
  durationEnableLabel: string;
  durationAmountLabel: string;
  roundHintLabel: string;
  getConditionLabel: (condition: ActiveInitiativeTrackerCondition | "none") => string;
  getConditionDescription: (condition: ActiveInitiativeTrackerCondition) => string;
  formatConditionEntryDuration: (entry: InitiativeTrackerConditionEntry) => string | null;
  getConditionDurationUnits: () => { value: InitiativeTrackerConditionDurationUnit; label: string }[];
  onAddCondition: (
    row: InitiativeTrackerRow,
    condition: ActiveInitiativeTrackerCondition,
    duration?: InitiativeTrackerConditionDuration,
  ) => void;
  onRemoveCondition: (row: InitiativeTrackerRow, condition: ActiveInitiativeTrackerCondition) => void;
  onClearConditions: (row: InitiativeTrackerRow) => void;
};

function ConditionInfoButton({
  label,
  description,
  className,
}: {
  label: string;
  description: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          className={cn(
            "inline-flex shrink-0 cursor-help items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white",
            className,
          )}>
          <Info
            aria-hidden="true"
            className="size-3.5"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-sm whitespace-pre-line text-left leading-relaxed">
        <span className="block font-semibold">{label}</span>
        <span className="mt-1 block font-normal text-background/90">{description}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export function ConditionSelect({
  row,
  label,
  searchPlaceholder,
  searchClearLabel,
  clearAllConditionsLabel,
  emptyText,
  addBackLabel,
  addConfirmLabel,
  durationEnableLabel,
  durationAmountLabel,
  roundHintLabel,
  getConditionLabel,
  getConditionDescription,
  formatConditionEntryDuration,
  getConditionDurationUnits,
  onAddCondition,
  onRemoveCondition,
  onClearConditions,
}: ConditionSelectProps) {
  const rowConditions = row.conditions ?? [];
  const [conditionSearch, setConditionSearch] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const [pendingCondition, setPendingCondition] = React.useState<ActiveInitiativeTrackerCondition | null>(null);
  const [useDuration, setUseDuration] = React.useState(false);
  const [durationAmount, setDurationAmount] = React.useState("1");
  const [durationUnit, setDurationUnit] = React.useState<InitiativeTrackerConditionDurationUnit>("rounds");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const optionsRef = React.useRef<HTMLDivElement>(null);
  const durationUnits = React.useMemo(() => getConditionDurationUnits(), [getConditionDurationUnits]);

  const filteredConditions = React.useMemo(() => {
    const query = conditionSearch.trim().toLowerCase();
    if (!query) return CONDITIONS;
    return CONDITIONS.filter((condition) => {
      const conditionLabel = getConditionLabel(condition).toLowerCase();
      const conditionDescription = getConditionDescription(condition).toLowerCase();
      return conditionLabel.includes(query) || conditionDescription.includes(query);
    });
  }, [conditionSearch, getConditionDescription, getConditionLabel]);
  const activeIndex = clampConditionIndex(highlightedIndex, filteredConditions.length);
  const isConditionSelected = (condition: ActiveInitiativeTrackerCondition) =>
    rowConditions.some((entry) => entry.condition === condition);

  const resetPending = () => {
    setPendingCondition(null);
    setUseDuration(false);
    setDurationAmount("1");
    setDurationUnit("rounds");
  };

  React.useEffect(() => {
    if (activeIndex < 0 || pendingCondition) return;
    const highlightedElement = optionsRef.current?.querySelector<HTMLElement>(
      `[data-condition-index="${activeIndex}"]`,
    );
    highlightedElement?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, pendingCondition]);

  const startAddCondition = (condition: ActiveInitiativeTrackerCondition) => {
    setPendingCondition(condition);
    setUseDuration(false);
    setDurationAmount("1");
    setDurationUnit("rounds");
  };

  const confirmAddCondition = () => {
    if (!pendingCondition) return;

    let duration: InitiativeTrackerConditionDuration | undefined;
    if (useDuration) {
      if (durationUnit === "untilCombatEnd") {
        duration = { amount: 1, unit: "untilCombatEnd" };
      } else {
        const amount = Math.max(1, Number.parseInt(durationAmount, 10) || 1);
        duration = { amount, unit: durationUnit };
      }
    }

    onAddCondition(row, pendingCondition, duration);
    resetPending();
  };

  const handleConditionClick = (condition: ActiveInitiativeTrackerCondition) => {
    if (isConditionSelected(condition)) {
      onRemoveCondition(row, condition);
      return;
    }

    startAddCondition(condition);
  };

  const handleHighlightedCondition = () => {
    const condition = filteredConditions[activeIndex];
    if (!condition) return;
    handleConditionClick(condition);
  };

  const handleOpenChange = (open: boolean) => {
    setConditionSearch("");
    setHighlightedIndex(0);
    resetPending();
    if (open) {
      window.requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (pendingCondition) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => clampConditionIndex(index + 1, filteredConditions.length));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => clampConditionIndex(index - 1, filteredConditions.length));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setHighlightedIndex(clampConditionIndex(0, filteredConditions.length));
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setHighlightedIndex(clampConditionIndex(filteredConditions.length - 1, filteredConditions.length));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      handleHighlightedCondition();
    }
  };

  const pendingMeta = pendingCondition ? CONDITION_META[pendingCondition] : null;
  const pendingLabel = pendingCondition ? getConditionLabel(pendingCondition) : "";
  const pendingDescription = pendingCondition ? getConditionDescription(pendingCondition) : "";

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
          className="w-80 border-white/10 bg-card p-3 text-white">
          {pendingCondition && pendingMeta ? (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={resetPending}
                className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm text-white/75 transition-colors hover:text-white">
                <ArrowLeft
                  aria-hidden="true"
                  className="size-4"
                />
                {addBackLabel}
              </button>

              <div className="flex items-start gap-2 rounded-[15px] bg-white/8 px-3 py-2.5">
                <pendingMeta.Icon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{pendingLabel}</p>
                  <p className="mt-1 max-h-28 overflow-y-auto whitespace-pre-line text-xs leading-relaxed text-white/75">
                    {pendingDescription}
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={useDuration}
                  onCheckedChange={(checked) => setUseDuration(Boolean(checked))}
                />
                <span>{durationEnableLabel}</span>
              </label>

              {useDuration && (
                <div className="flex flex-col gap-2">
                  {durationUnit !== "untilCombatEnd" && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-white/70">{durationAmountLabel}</span>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={durationAmount}
                        onChange={(event) => setDurationAmount(event.target.value)}
                        className="h-8 bg-gray-middle-light text-sm"
                      />
                    </div>
                  )}
                  <Select
                    value={durationUnit}
                    onValueChange={(value) => setDurationUnit(value as InitiativeTrackerConditionDurationUnit)}>
                    <SelectTrigger className="h-8 w-full bg-gray-middle-light text-sm text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-card text-white">
                      {durationUnits.map((unit) => (
                        <SelectItem
                          key={unit.value}
                          value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {durationUnit === "rounds" && (
                    <p className="text-xs text-white/60">{roundHintLabel}</p>
                  )}
                </div>
              )}

              <Button
                type="button"
                variant="default"
                onClick={confirmAddCondition}
                className="h-9 w-full rounded-[15px] text-sm font-semibold">
                {addConfirmLabel}
              </Button>
            </div>
          ) : (
            <>
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
                className="flex max-h-56 flex-col gap-2 overflow-y-auto px-0.5 py-0.5">
                {filteredConditions.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-muted-foreground">{emptyText}</p>
                ) : (
                  filteredConditions.map((condition, index) => {
                    const isSelected = isConditionSelected(condition);
                    const isHighlighted = index === activeIndex;
                    const { Icon, optionClassName } = CONDITION_META[condition];
                    const conditionLabel = getConditionLabel(condition);
                    const conditionDescription = getConditionDescription(condition);
                    return (
                      <div
                        key={condition}
                        id={`${row.id}-condition-${condition}`}
                        role="option"
                        aria-selected={isSelected}
                        data-condition-index={index}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={cn(
                          "flex w-full items-center gap-1.5 rounded-[15px] px-2 py-1.5 text-sm transition-colors",
                          isHighlighted && "bg-white/10",
                          isSelected && "bg-white/12 font-semibold ring-1 ring-inset ring-white/20",
                          optionClassName,
                        )}>
                        <button
                          type="button"
                          onClick={() => handleConditionClick(condition)}
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-[12px] text-left outline-hidden">
                          <Icon
                            aria-hidden="true"
                            className="size-4 shrink-0"
                          />
                          <span className="min-w-0 flex-1 truncate">{conditionLabel}</span>
                          {isSelected && (
                            <Check
                              aria-hidden="true"
                              className="size-4 shrink-0 text-white"
                            />
                          )}
                        </button>
                        <ConditionInfoButton
                          label={conditionLabel}
                          description={conditionDescription}
                          className="size-6"
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
        {rowConditions.length === 0 ? (
          <span className="text-sm text-white/70">{getConditionLabel("none")}</span>
        ) : (
          rowConditions.map((entry) => {
            const { Icon, badgeClassName } = CONDITION_META[entry.condition];
            const conditionLabel = getConditionLabel(entry.condition);
            const conditionDescription = getConditionDescription(entry.condition);
            const durationLabel = formatConditionEntryDuration(entry);
            const badgeText = durationLabel ? `${conditionLabel} (${durationLabel})` : conditionLabel;
            return (
              <span
                key={entry.condition}
                className={cn(
                  "inline-flex max-w-[220px] items-center gap-1 rounded-full border py-1 pl-2 pr-1 text-xs font-medium",
                  badgeClassName,
                )}
                title={badgeText}>
                <Icon
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                />
                <span className="min-w-0 flex-1 truncate">{badgeText}</span>
                <ConditionInfoButton
                  label={conditionLabel}
                  description={conditionDescription}
                  className="size-5"
                />
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}
