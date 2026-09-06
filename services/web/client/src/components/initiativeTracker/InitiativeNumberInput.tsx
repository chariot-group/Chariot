"use client";

import { Input } from "@/components/ui/input";
import { InitiativeModifierHint } from "@/components/initiativeTracker/InitiativeModifierHint";
import { useInitiativeTextInput } from "@/components/initiativeTracker/useInitiativeTextInput";
import {
  initiativeRollFromTotal,
  initiativeTotalFromRoll,
  resolveInitiativeModifier,
} from "@/components/initiativeTracker/utils";
import { cn } from "@/lib/utils";
import { formatSignedBonus } from "@/utils/attack.utils";

const INITIATIVE_CONTAINER_CLASS = "mx-auto w-full max-w-[88px]";
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
  /** FR-tracker-initiative-modifier-display — bonus fiche affiché au-dessus de la saisie. */
  modifier?: number | null;
  modifierAriaLabel?: string;
  showModifier?: boolean;
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

  const modifierText = formatSignedBonus(resolvedModifier);
  const hintAriaLabel = modifierAriaLabel ?? modifierText;
  const combinedAriaLabel = showModifier ? `${ariaLabel}, ${hintAriaLabel}` : ariaLabel;

  return (
    <div className={cn(INITIATIVE_CONTAINER_CLASS, containerClassName)}>
      {showModifier ? (
        <div className="flex justify-center">
          <InitiativeModifierHint
            modifierText={modifierText}
            ariaLabel={hintAriaLabel}
          />
        </div>
      ) : null}
      <Input
        type="number"
        step={1}
        value={initiativeInput.value}
        aria-label={combinedAriaLabel}
        onChange={initiativeInput.onChange}
        onFocus={initiativeInput.onFocus}
        onBlur={initiativeInput.onBlur}
        onKeyDown={initiativeInput.onKeyDown}
        className={className}
      />
    </div>
  );
}
