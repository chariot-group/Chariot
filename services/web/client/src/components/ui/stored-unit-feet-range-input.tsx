"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { useStoredFeetRangeInput } from "@/hooks/useStoredFeetRangeInput";
import { parseStoredFeetRange } from "@/utils/unit.utils";

interface StoredUnitFeetRangeInputProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> {
  storedValue: string;
  onStoredChange: (value: string) => void;
  toStored: (displayValue: number) => number;
  toDisplay: (storedFeet: number) => number;
  unitLabel?: string;
}

export function StoredUnitFeetRangeInput({
  storedValue,
  onStoredChange,
  toStored,
  toDisplay,
  unitLabel,
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

  return (
    <div className="flex items-center gap-1 w-full sm:w-auto sm:max-w-48">
      <Input
        {...inputProps}
        ref={externalRef}
        type={isNumericRange ? "number" : "text"}
        inputMode={isNumericRange ? "decimal" : "text"}
        min={isNumericRange ? 0 : undefined}
        step={isNumericRange ? "any" : undefined}
        value={rangeInput.value}
        onChange={rangeInput.onChange}
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
