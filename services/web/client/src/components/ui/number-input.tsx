"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NumberInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  /** Leading element inside the field (icon). Decorative: give it `aria-hidden` / `alt=""`. */
  startAdornment?: React.ReactNode;
  /** Trailing element inside the field, before the stepper (unit such as `m` / `ft`). */
  endAdornment?: React.ReactNode;
  /** Classes of the native `<input>`. `className` styles the whole field (size, background, radius). */
  inputClassName?: string;
}

function parseNumberAttribute(value: string): number | null {
  if (value.trim() === "") return null;

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

/** Next value of a stepper click, honoring `step`, `min`, `max` and the decimal precision in use. */
export function computeSteppedValue(
  input: Pick<HTMLInputElement, "value" | "step" | "min" | "max">,
  direction: "up" | "down",
): string {
  const step = Number(input.step);
  const fallbackStep = Number.isFinite(step) && step > 0 ? step : 1;
  const currentValue = Number(input.value);
  const min = parseNumberAttribute(input.min);
  const max = parseNumberAttribute(input.max);
  const fallbackBase = Number.isFinite(currentValue) ? currentValue : 0;
  const nextValue = direction === "up" ? fallbackBase + fallbackStep : fallbackBase - fallbackStep;
  const clampedValue = Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, nextValue));
  const decimalPrecision = Math.min(
    10,
    Math.max(input.value.split(".")[1]?.length ?? 0, input.step.split(".")[1]?.length ?? 0),
  );

  return String(Number(clampedValue.toFixed(decimalPrecision)));
}

/**
 * Field frame shared by inputs with adornments: background, radius, and the focus/invalid frame
 * drawn around the whole field (adornments included), not only the native input.
 */
export const inputFrameClassName = cn(
  "flex h-9 w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-[15px] bg-gray-middle-light px-3 text-base shadow-xs transition-[color,box-shadow] md:text-sm",
  "focus-within:border has-[input[aria-invalid=true]]:border-destructive",
  "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
);

/** Native input living inside `inputFrameClassName` (the frame owns background and focus). */
export const framedInputClassName =
  "placeholder:text-foreground selection:bg-primary selection:text-primary-foreground h-full w-full min-w-0 flex-1 bg-transparent p-0 outline-none [text-align:inherit] disabled:pointer-events-none disabled:cursor-not-allowed";

const stepperButtonClassName =
  "flex flex-1 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30";

/**
 * Numeric field of the app: optional icon and unit, custom stepper, and one focus/invalid frame
 * around the whole field (icon + input + unit + stepper).
 */
function NumberInput({
  className,
  inputClassName,
  startAdornment,
  endAdornment,
  ref: externalRef,
  disabled,
  ...props
}: NumberInputProps) {
  const innerRef = React.useRef<HTMLInputElement>(null);

  const mergedRef = (node: HTMLInputElement | null) => {
    innerRef.current = node;
    if (typeof externalRef === "function") externalRef(node);
    else if (externalRef != null) {
      (externalRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
    }
  };

  const handleStep = (direction: "up" | "down") => {
    const input = innerRef.current;
    if (!input || disabled) return;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    nativeInputValueSetter?.call(input, computeSteppedValue(input, direction));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };

  return (
    <div
      data-slot="number-input"
      data-disabled={disabled || undefined}
      className={cn(
        inputFrameClassName,
        className,
        // The stepper always sits flush against the right edge
        "pr-0",
      )}>
      {startAdornment ? (
        <span
          data-slot="number-input-start"
          className="flex shrink-0 items-center text-muted-foreground">
          {startAdornment}
        </span>
      ) : null}
      <input
        type="number"
        ref={mergedRef}
        data-slot="input"
        disabled={disabled}
        className={cn(
          framedInputClassName,
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          inputClassName,
        )}
        {...props}
      />
      {endAdornment ? (
        <span
          data-slot="number-input-end"
          className="shrink-0 text-xs text-muted-foreground">
          {endAdornment}
        </span>
      ) : null}
      <div
        data-slot="number-input-stepper"
        className="flex h-full w-7 shrink-0 flex-col self-stretch">
        <button
          type="button"
          aria-label="Incrémenter"
          tabIndex={-1}
          disabled={!!disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            handleStep("up");
          }}
          className={stepperButtonClassName}>
          <ChevronUpIcon className="size-3" />
        </button>
        <button
          type="button"
          aria-label="Décrémenter"
          tabIndex={-1}
          disabled={!!disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            handleStep("down");
          }}
          className={stepperButtonClassName}>
          <ChevronDownIcon className="size-3" />
        </button>
      </div>
    </div>
  );
}

export { NumberInput };
