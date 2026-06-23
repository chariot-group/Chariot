"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { useStoredUnitInput, type StoredUnitEmptyValue } from "@/hooks/useStoredUnitInput";

interface StoredUnitNumberInputProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> {
  storedValue: number | string | null | undefined;
  onStoredChange: (value: number | string | null) => void;
  toStored: (displayValue: number) => number;
  toDisplay: (storedValue: number) => number;
  emptyValue?: StoredUnitEmptyValue;
}

export function StoredUnitNumberInput({
  storedValue,
  onStoredChange,
  toStored,
  toDisplay,
  emptyValue,
  onFocus,
  onBlur,
  ref: externalRef,
  ...inputProps
}: StoredUnitNumberInputProps) {
  const unitInput = useStoredUnitInput(storedValue, onStoredChange, {
    toStored,
    toDisplay,
    emptyValue,
  });

  return (
    <Input
      {...inputProps}
      ref={externalRef}
      value={unitInput.value}
      onChange={unitInput.onChange}
      onFocus={(event) => {
        unitInput.onFocus(event);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        unitInput.onBlur(event);
        onBlur?.(event);
      }}
    />
  );
}
