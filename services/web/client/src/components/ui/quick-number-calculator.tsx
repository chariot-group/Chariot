"use client";

import { type ComponentProps, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type QuickCalculatorOperation = "add" | "subtract" | "set";

interface QuickNumberCalculatorProps {
  value: number | string | null | undefined;
  onValueChange: (nextValue: number) => void;
  currentValue: number | null | undefined;
  onApply: (nextValue: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  /**
   * Champ optionnel : vide la valeur au lieu de forcer 0 quand l’utilisateur efface le champ.
   */
  onEmptyInput?: () => void;
  triggerLabel?: string;
  inputLabel?: string;
  tooltipPlaceholder?: string;
  onConstraintResult?: (payload: {
    attemptedValue: number;
    appliedValue: number;
    wasClamped: boolean;
    source: "quick-action" | "direct-input";
  }) => void;
  inputProps?: Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange" | "disabled">;
}

export function QuickNumberCalculator({
  value,
  onValueChange,
  currentValue,
  onApply,
  min,
  max,
  disabled = false,
  onEmptyInput,
  triggerLabel = "Quick calculator",
  inputLabel = "Value",
  tooltipPlaceholder = "Saisir une valeur",
  onConstraintResult,
  inputProps,
}: QuickNumberCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [operationValue, setOperationValue] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const operationInputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const subtractButtonRef = useRef<HTMLButtonElement>(null);
  const setButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      operationInputRef.current?.focus();
      operationInputRef.current?.select();
    }
  }, [isOpen]);

  const parsedOperationValue = Number(operationValue);
  const canApply = operationValue.trim() !== "" && Number.isFinite(parsedOperationValue);

  function clampValue(valueToClamp: number): number {
    let clampedValue = valueToClamp;

    if (typeof min === "number") {
      clampedValue = Math.max(min, clampedValue);
    }

    if (typeof max === "number") {
      clampedValue = Math.min(max, clampedValue);
    }

    return clampedValue;
  }

  function applyOperation(operation: QuickCalculatorOperation) {
    if (!canApply) {
      return;
    }

    const baseValue = typeof currentValue === "number" ? currentValue : 0;
    let nextValue = baseValue;

    if (operation === "add") {
      nextValue = baseValue + parsedOperationValue;
    }

    if (operation === "subtract") {
      nextValue = baseValue - parsedOperationValue;
    }

    if (operation === "set") {
      nextValue = parsedOperationValue;
    }

    const attemptedValue = nextValue;
    nextValue = clampValue(nextValue);

    onApply(nextValue);

    onConstraintResult?.({
      attemptedValue,
      appliedValue: nextValue,
      wasClamped: attemptedValue !== nextValue,
      source: "quick-action",
    });

    setOperationValue("");
    setIsOpen(false);
  }

  function handleBaseInputChange(rawValue: string) {
    if (rawValue === "") {
      if (onEmptyInput) {
        onEmptyInput();
        return;
      }
      onValueChange(0);
      return;
    }

    const parsedValue = Number(rawValue);
    if (Number.isFinite(parsedValue)) {
      const clampedValue = clampValue(parsedValue);

      onValueChange(clampedValue);

      onConstraintResult?.({
        attemptedValue: parsedValue,
        appliedValue: clampedValue,
        wasClamped: parsedValue !== clampedValue,
        source: "direct-input",
      });
    }
  }

  function moveButtonFocus(current: QuickCalculatorOperation, direction: "left" | "right") {
    const orderedButtons = ["add", "subtract", "set"] as const;
    const currentIndex = orderedButtons.indexOf(current);
    const nextIndex = direction === "right"
      ? (currentIndex + 1) % orderedButtons.length
      : (currentIndex - 1 + orderedButtons.length) % orderedButtons.length;

    const nextTarget = orderedButtons[nextIndex];
    if (nextTarget === "add") {
      addButtonRef.current?.focus();
    }
    if (nextTarget === "subtract") {
      subtractButtonRef.current?.focus();
    }
    if (nextTarget === "set") {
      setButtonRef.current?.focus();
    }
  }

  const inputValue = value ?? (onEmptyInput ? "" : 0);
  const { onClick: inputOnClick, onFocus: inputOnFocus, ...restInputProps } = inputProps ?? {};

  return (
    <div
      ref={containerRef}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (!nextTarget || !containerRef.current?.contains(nextTarget)) {
          setIsOpen(false);
        }
      }}
      className="relative w-full min-w-0">
      <Input
        {...restInputProps}
        type="number"
        value={inputValue}
        disabled={disabled}
        onClick={(event) => {
          inputOnClick?.(event);
          setIsOpen(true);
        }}
        onFocus={(event) => {
          inputOnFocus?.(event);
          setIsOpen(true);
        }}
        onChange={(event) => handleBaseInputChange(event.target.value)}
      />

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 z-50 w-full min-w-36 max-w-[calc(100vw-2rem)] rounded-[15px] border bg-card p-2 shadow-lg sm:w-44"
          role="dialog"
          aria-label={triggerLabel}>
          <Input
            ref={operationInputRef}
            type="number"
            value={operationValue}
            onChange={(event) => setOperationValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyOperation("set");
              }

              if (event.key === "+") {
                event.preventDefault();
                applyOperation("add");
              }

              if (event.key === "-") {
                event.preventDefault();
                applyOperation("subtract");
              }

              if (event.key === "=") {
                event.preventDefault();
                applyOperation("set");
              }

              if (event.key === "ArrowDown") {
                event.preventDefault();
                addButtonRef.current?.focus();
              }
            }}
            aria-label={inputLabel}
            placeholder={tooltipPlaceholder}
            className="h-8 rounded-md px-2 text-xs"
          />
          <div className="mt-2 grid grid-cols-3 gap-1">
            <Button
              ref={addButtonRef}
              type="button"
              size="sm"
              variant="default"
              disabled={!canApply}
              onClick={() => applyOperation("add")}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  moveButtonFocus("add", "right");
                }
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveButtonFocus("add", "left");
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  operationInputRef.current?.focus();
                }
              }}
              aria-label="Ajouter">
              +
            </Button>
            <Button
              ref={subtractButtonRef}
              type="button"
              size="sm"
              variant="default"
              disabled={!canApply}
              onClick={() => applyOperation("subtract")}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  moveButtonFocus("subtract", "right");
                }
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveButtonFocus("subtract", "left");
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  operationInputRef.current?.focus();
                }
              }}
              aria-label="Soustraire">
              -
            </Button>
            <Button
              ref={setButtonRef}
              type="button"
              size="sm"
              variant="default"
              disabled={!canApply}
              onClick={() => applyOperation("set")}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  moveButtonFocus("set", "right");
                }
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveButtonFocus("set", "left");
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  operationInputRef.current?.focus();
                }
              }}
              aria-label="Affecter">
              =
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
