"use client";

import { Input } from "@/components/ui/input";
import { useInitiativeTextInput } from "@/components/initiativeTracker/useInitiativeTextInput";
import { cn } from "@/lib/utils";

const INITIATIVE_CONTAINER_CLASS = "mx-auto w-full max-w-[88px]";
const INITIATIVE_INPUT_CLASS =
  "h-9 w-full rounded-[15px] bg-gray-middle-light px-3 text-center text-sm font-normal tabular-nums text-white";

type InitiativeNumberInputProps = {
  value: number;
  resetKey: string;
  ariaLabel: string;
  onCommit: (value: number) => void;
  className?: string;
  containerClassName?: string;
};

export function InitiativeNumberInput({
  value,
  resetKey,
  ariaLabel,
  onCommit,
  className = INITIATIVE_INPUT_CLASS,
  containerClassName,
}: InitiativeNumberInputProps) {
  const initiativeInput = useInitiativeTextInput(value, onCommit, resetKey);

  return (
    <div className={cn(INITIATIVE_CONTAINER_CLASS, containerClassName)}>
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
    </div>
  );
}
