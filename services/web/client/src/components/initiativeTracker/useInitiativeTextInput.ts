"use client";

import * as React from "react";
import { registerInitiativeInputFlush } from "@/lib/flushPendingInitiativeInputs";

export function parseInitiativeRollText(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "+") return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Évite le bug du `0` figé dans les champs number contrôlés (saisie locale + commit).
 * FR-tracker-initiative-modifier-display — commit pendant la saisie + flush explicite avant start combat.
 */
export function useInitiativeTextInput(
  externalValue: number,
  onCommit: (value: number) => void,
  resetKey?: string,
) {
  const [text, setText] = React.useState(() => String(externalValue));
  const isFocusedRef = React.useRef(false);
  const textRef = React.useRef(text);
  const onCommitRef = React.useRef(onCommit);

  textRef.current = text;
  onCommitRef.current = onCommit;

  React.useEffect(() => {
    if (isFocusedRef.current) return;
    setText(String(externalValue));
    textRef.current = String(externalValue);
  }, [externalValue, resetKey]);

  const commit = React.useCallback((raw: string, options?: { allowEmpty?: boolean }) => {
    const parsed = parseInitiativeRollText(raw);
    if (parsed == null) {
      if (!options?.allowEmpty) return;
      onCommitRef.current(0);
      setText("0");
      textRef.current = "0";
      return;
    }
    onCommitRef.current(parsed);
    setText(String(parsed));
    textRef.current = String(parsed);
  }, []);

  React.useEffect(() => {
    return registerInitiativeInputFlush(() => {
      isFocusedRef.current = false;
      commit(textRef.current, { allowEmpty: true });
    });
  }, [commit]);

  const onFocus = React.useCallback(() => {
    isFocusedRef.current = true;
    setText((current) => {
      const trimmed = current.trim();
      if (trimmed === "" || trimmed === "0") {
        textRef.current = "";
        return "";
      }
      const parsed = Number.parseInt(trimmed, 10);
      if (Number.isFinite(parsed) && parsed === 0) {
        textRef.current = "";
        return "";
      }
      return current;
    });
  }, []);

  const onBlur = React.useCallback(() => {
    isFocusedRef.current = false;
    commit(textRef.current, { allowEmpty: true });
  }, [commit]);

  return {
    value: text,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      textRef.current = next;
      setText(next);
      // Keep Redux in sync while typing so Start combat never depends on blur alone.
      commit(next);
    },
    onFocus,
    onBlur,
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        isFocusedRef.current = false;
        commit(textRef.current, { allowEmpty: true });
      }
    },
  };
}
