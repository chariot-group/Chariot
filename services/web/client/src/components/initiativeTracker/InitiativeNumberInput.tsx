"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { InitiativeModifierHint } from "@/components/initiativeTracker/InitiativeModifierHint";
import {
  parseInitiativeRollText,
  useInitiativeTextInput,
} from "@/components/initiativeTracker/useInitiativeTextInput";
import {
  formatInitiativeTotalPreview,
  INITIATIVE_INPUT_ATTRIBUTE,
  initiativeRollFromTotal,
  initiativeTotalFromRoll,
  resolveInitiativeModifier,
} from "@/components/initiativeTracker/utils";
import { cn } from "@/lib/utils";
import { formatSignedBonus } from "@/utils/attack.utils";

const INITIATIVE_CONTAINER_CLASS = "mx-auto w-full max-w-[88px]";
/** Muted roll placeholder, hidden as soon as the field is focused to type a value. */
const INITIATIVE_PLACEHOLDER_CLASS =
  "[&_input::placeholder]:text-white/40 [&_input:focus::placeholder]:text-transparent";
const INITIATIVE_INPUT_CLASS =
  "h-9 w-full rounded-[15px] bg-gray-middle-light px-3 text-center text-sm font-normal tabular-nums text-white";

type InitiativeNumberInputProps = {
  /** Persisted tracker total (`roll + modifier`). */
  value: number;
  resetKey: string;
  ariaLabel: string;
  /** Receives the persisted total after applying the modifier to the typed roll. */
  onCommit: (total: number) => void;
  className?: string;
  containerClassName?: string;
  /** FR-combat-initiative-tracker — bonus fiche affiché au-dessus de la saisie. */
  modifier?: number | null;
  modifierAriaLabel?: string;
  showModifier?: boolean;
  /** FR-combat-initiative-tracker — placeholder naming the expected d20 roll. */
  rollPlaceholder?: string;
  /** Screen-reader prefix of the live total preview (e.g. "Total d'initiative :"). */
  totalPreviewLabel?: string;
};

export function InitiativeNumberInput({
  value,
  resetKey,
  ariaLabel,
  onCommit,
  className = INITIATIVE_INPUT_CLASS,
  containerClassName,
  modifier = null,
  modifierAriaLabel,
  showModifier = false,
  rollPlaceholder,
  totalPreviewLabel,
}: InitiativeNumberInputProps) {
  const resolvedModifier = resolveInitiativeModifier(modifier);
  const rollValue = initiativeRollFromTotal(value, resolvedModifier);

  const initiativeInput = useInitiativeTextInput(
    rollValue,
    (roll) => {
      onCommit(initiativeTotalFromRoll(roll, resolvedModifier));
    },
    resetKey,
  );

  const inputRef = React.useRef<HTMLInputElement>(null);
  const previewId = React.useId();

  // A `0` roll is the "missing initiative" sentinel: show the roll placeholder instead.
  const displayValue = initiativeInput.value.trim() === "0" ? "" : initiativeInput.value;
  const totalPreview = showModifier
    ? formatInitiativeTotalPreview(parseInitiativeRollText(displayValue), resolvedModifier)
    : null;

  const modifierText = formatSignedBonus(resolvedModifier);
  const hintAriaLabel = modifierAriaLabel ?? modifierText;
  const combinedAriaLabel = showModifier ? `${ariaLabel}, ${hintAriaLabel}` : ariaLabel;

  return (
    <div
      className={cn(INITIATIVE_CONTAINER_CLASS, containerClassName)}
      onMouseDownCapture={(event) => {
        // Stepper buttons cancel the mousedown default, so the input would never take focus
        // (and the tracker could not freeze its row order while the GM keeps clicking).
        if ((event.target as Element).closest('[data-slot="number-input-stepper"]')) {
          inputRef.current?.focus();
        }
      }}>
      {showModifier ? (
        <div className="flex justify-center">
          <InitiativeModifierHint
            modifierText={modifierText}
            ariaLabel={hintAriaLabel}
            displayText={totalPreview}
          />
        </div>
      ) : null}
      <Input
        ref={inputRef}
        type="number"
        {...{ [INITIATIVE_INPUT_ATTRIBUTE]: "" }}
        step={1}
        value={displayValue}
        placeholder={rollPlaceholder}
        aria-label={combinedAriaLabel}
        aria-describedby={showModifier ? previewId : undefined}
        onChange={initiativeInput.onChange}
        onFocus={initiativeInput.onFocus}
        onBlur={initiativeInput.onBlur}
        onKeyDown={initiativeInput.onKeyDown}
        className={cn(className, INITIATIVE_PLACEHOLDER_CLASS)}
      />
      {showModifier ? (
        <span
          id={previewId}
          aria-live="polite"
          className="sr-only">
          {totalPreview ? `${totalPreviewLabel ? `${totalPreviewLabel} ` : ""}${totalPreview}` : ""}
        </span>
      ) : null}
    </div>
  );
}
