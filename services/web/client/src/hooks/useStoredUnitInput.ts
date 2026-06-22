"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FocusEvent } from "react";

export type StoredUnitEmptyValue = null | "";

export interface StoredUnitInputHandlers {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFocus: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur: (event: FocusEvent<HTMLInputElement>) => void;
}

interface UseStoredUnitInputOptions {
  toStored: (displayValue: number) => number;
  toDisplay: (storedValue: number) => number;
  emptyValue?: StoredUnitEmptyValue;
}

/** Maps canonical stored value to the user's display unit text. */
export function storedValueToDisplayText(
  storedValue: number | string | null | undefined,
  toDisplay: (storedValue: number) => number,
): string {
  if (storedValue == null || storedValue === "") return "";

  const storedNumeric = Number(storedValue);
  if (!Number.isFinite(storedNumeric)) return "";

  return String(toDisplay(storedNumeric));
}

/** Parses display-unit text into canonical stored value; returns emptyValue, stored number, or "invalid". */
export function displayTextToStoredValue(
  displayText: string,
  toStored: (displayValue: number) => number,
): number | StoredUnitEmptyValue | "invalid" {
  const trimmed = displayText.trim();
  if (trimmed === "") return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return "invalid";

  return toStored(parsed);
}

export function useStoredUnitInput(
  storedValue: number | string | null | undefined,
  onStoredChange: (value: number | string | null) => void,
  options: UseStoredUnitInputOptions,
): StoredUnitInputHandlers {
  const { toStored, toDisplay, emptyValue = "" } = options;
  const [displayText, setDisplayText] = useState(() => storedValueToDisplayText(storedValue, toDisplay));
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (isFocusedRef.current) return;
    setDisplayText(storedValueToDisplayText(storedValue, toDisplay));
  }, [storedValue, toDisplay]);

  const handleFocus = useCallback(
    (_event: FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = true;
      setDisplayText(storedValueToDisplayText(storedValue, toDisplay));
    },
    [storedValue, toDisplay],
  );

  const handleBlur = useCallback(
    (_event: FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = false;

      const committed = displayTextToStoredValue(displayText, toStored);
      if (committed === "invalid") {
        setDisplayText(storedValueToDisplayText(storedValue, toDisplay));
        return;
      }

      if (committed === null) {
        onStoredChange(emptyValue);
        setDisplayText("");
        return;
      }

      onStoredChange(committed);
      setDisplayText(storedValueToDisplayText(committed, toDisplay));
    },
    [displayText, emptyValue, onStoredChange, storedValue, toDisplay, toStored],
  );

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDisplayText(event.target.value);
  }, []);

  return {
    value: displayText,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };
}
