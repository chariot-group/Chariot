"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FocusEvent } from "react";

import {
  displayTextToStoredFeetRange,
  storedFeetRangeToDisplayText,
} from "@/utils/unit.utils";

export interface StoredFeetRangeInputHandlers {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFocus: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur: (event: FocusEvent<HTMLInputElement>) => void;
}

interface UseStoredFeetRangeInputOptions {
  toStored: (displayValue: number) => number;
  toDisplay: (storedFeet: number) => number;
}

export function useStoredFeetRangeInput(
  storedValue: string,
  onStoredChange: (value: string) => void,
  options: UseStoredFeetRangeInputOptions,
): StoredFeetRangeInputHandlers {
  const { toStored, toDisplay } = options;
  const [displayText, setDisplayText] = useState(() => storedFeetRangeToDisplayText(storedValue, toDisplay));
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (isFocusedRef.current) return;
    setDisplayText(storedFeetRangeToDisplayText(storedValue, toDisplay));
  }, [storedValue, toDisplay]);

  const handleFocus = useCallback(
    (_event: FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = true;
      setDisplayText(storedFeetRangeToDisplayText(storedValue, toDisplay));
    },
    [storedValue, toDisplay],
  );

  const handleBlur = useCallback(
    (_event: FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = false;

      const committed = displayTextToStoredFeetRange(displayText, toStored);
      if (committed === "invalid") {
        setDisplayText(storedFeetRangeToDisplayText(storedValue, toDisplay));
        return;
      }

      if (committed === null) {
        onStoredChange("");
        setDisplayText("");
        return;
      }

      onStoredChange(committed);
      setDisplayText(storedFeetRangeToDisplayText(committed, toDisplay));
    },
    [displayText, onStoredChange, storedValue, toDisplay, toStored],
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
