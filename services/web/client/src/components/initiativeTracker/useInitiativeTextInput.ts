"use client";

import * as React from "react";

/** Évite le bug du `0` figé dans les champs number contrôlés (saisie locale + commit au blur). */
export function useInitiativeTextInput(
  externalValue: number,
  onCommit: (value: number) => void,
  resetKey?: string,
) {
  const [text, setText] = React.useState(() => String(externalValue));
  const isFocusedRef = React.useRef(false);

  React.useEffect(() => {
    if (isFocusedRef.current) return;
    setText(String(externalValue));
  }, [externalValue, resetKey]);

  const commit = React.useCallback(() => {
    const trimmed = text.trim();
    const parsed = trimmed === "" ? 0 : Number.parseInt(trimmed, 10);
    const next = Number.isFinite(parsed) ? parsed : 0;
    onCommit(next);
    setText(String(next));
  }, [onCommit, text]);

  const onFocus = React.useCallback(() => {
    isFocusedRef.current = true;
    setText((current) => {
      const trimmed = current.trim();
      if (trimmed === "" || trimmed === "0") return "";
      const parsed = Number.parseInt(trimmed, 10);
      return Number.isFinite(parsed) && parsed === 0 ? "" : current;
    });
  }, []);

  const onBlur = React.useCallback(() => {
    isFocusedRef.current = false;
    commit();
  }, [commit]);

  return {
    value: text,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setText(event.target.value),
    onFocus,
    onBlur,
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        isFocusedRef.current = false;
        commit();
      }
    },
  };
}
