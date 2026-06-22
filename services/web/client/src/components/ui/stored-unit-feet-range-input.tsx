"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { useStoredFeetRangeInput } from "@/hooks/useStoredFeetRangeInput";
import { parseStoredFeetRange } from "@/utils/unit.utils";
import { cn } from "@/lib/utils";

interface StoredUnitFeetRangeInputProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> {
  storedValue: string;
  onStoredChange: (value: string) => void;
  toStored: (displayValue: number) => number;
  toDisplay: (storedFeet: number) => number;
  unitLabel?: string;
  containerClassName?: string;
}

export function StoredUnitFeetRangeInput({
  storedValue,
  onStoredChange,
  toStored,
  toDisplay,
  unitLabel,
  containerClassName,
  onFocus,
  onBlur,
  ref: externalRef,
  ...inputProps
}: StoredUnitFeetRangeInputProps) {
  const rangeInput = useStoredFeetRangeInput(storedValue, onStoredChange, {
    toStored,
    toDisplay,
  });

  const storedFeet = parseStoredFeetRange(storedValue);
  const trimmedDisplay = rangeInput.value.trim();
  const displayNumeric = trimmedDisplay !== "" && Number.isFinite(Number(trimmedDisplay));
  const isNumericRange =
    displayNumeric || storedFeet != null || (storedValue.trim() === "" && trimmedDisplay === "");
  const showUnitLabel = storedFeet != null || displayNumeric;

  const { type: explicitType, ...restInputProps } = inputProps;
  const resolvedType = explicitType ?? (isNumericRange ? "number" : "text");

  return (
    <div className={cn("flex min-w-0 items-center gap-1 w-full max-w-full", containerClassName)}>
      <Input
        {...restInputProps}
        ref={externalRef}
        type={resolvedType}
        inputMode={isNumericRange ? "decimal" : "text"}
        min={resolvedType === "number" && isNumericRange ? 0 : undefined}
        step={resolvedType === "number" && isNumericRange ? "any" : undefined}
        value={rangeInput.value}
        onChange={rangeInput.onChange}
        className={cn("min-w-0 flex-1 w-full", restInputProps.className)}
        onFocus={(event) => {
          rangeInput.onFocus(event);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          rangeInput.onBlur(event);
          onBlur?.(event);
        }}
      />
      {showUnitLabel && unitLabel ? (
        <span className="text-xs text-muted-foreground shrink-0">{unitLabel}</span>
      ) : null}
    </div>
  );
}
