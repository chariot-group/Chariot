"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { framedInputClassName, inputFrameClassName, NumberInput } from "@/components/ui/number-input";
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

  const sharedProps = {
    ...restInputProps,
    ref: externalRef,
    value: rangeInput.value,
    onChange: rangeInput.onChange,
    className: cn("min-w-0 flex-1 w-full", restInputProps.className),
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
      rangeInput.onFocus(event);
      onFocus?.(event);
    },
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
      rangeInput.onBlur(event);
      onBlur?.(event);
    },
  };

  return (
    <div className={cn("flex min-w-0 items-center gap-1 w-full max-w-full", containerClassName)}>
      {resolvedType === "number" ? (
        <NumberInput
          {...sharedProps}
          inputMode={isNumericRange ? "decimal" : "text"}
          min={isNumericRange ? 0 : undefined}
          step={isNumericRange ? "any" : undefined}
          endAdornment={showUnitLabel && unitLabel ? unitLabel : undefined}
        />
      ) : (
        // Free text (e.g. "Touch") keeps the same frame so focus wraps the input and its unit
        <div
          data-slot="text-unit-input"
          data-disabled={sharedProps.disabled || undefined}
          className={cn(inputFrameClassName, sharedProps.className)}>
          <input
            {...sharedProps}
            className={framedInputClassName}
            data-slot="input"
            type={resolvedType}
            inputMode={isNumericRange ? "decimal" : "text"}
          />
          {showUnitLabel && unitLabel ? (
            <span className="shrink-0 text-xs text-muted-foreground">{unitLabel}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
