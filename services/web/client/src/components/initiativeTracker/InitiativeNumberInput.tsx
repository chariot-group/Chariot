"use client";

import { Input } from "@/components/ui/input";
import { useInitiativeTextInput } from "./useInitiativeTextInput";

const INITIATIVE_INPUT_CLASS =
  "h-9 w-full max-w-[88px] rounded-[15px] bg-gray-middle-light px-3 text-center text-sm font-normal tabular-nums text-white";

type InitiativeNumberInputProps = {
  value: number;
  resetKey: string;
  ariaLabel: string;
  onCommit: (value: number) => void;
  className?: string;
};

export function InitiativeNumberInput({
  value,
  resetKey,
  ariaLabel,
  onCommit,
  className = INITIATIVE_INPUT_CLASS,
}: InitiativeNumberInputProps) {
  const initiativeInput = useInitiativeTextInput(value, onCommit, resetKey);

  return (
    <Input
      type="number"
      step={1}
      value={initiativeInput.value}
      aria-label={ariaLabel}
      onChange={initiativeInput.onChange}
      onFocus={initiativeInput.onFocus}
      onBlur={initiativeInput.onBlur}
      onKeyDown={initiativeInput.onKeyDown}
      className={className}
    />
  );
}
