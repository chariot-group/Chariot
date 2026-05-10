"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Input({ className, type, ref: externalRef, ...props }: React.ComponentProps<"input">) {
  const innerRef = React.useRef<HTMLInputElement>(null);

  const mergedRef = (node: HTMLInputElement | null) => {
    (innerRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
    if (typeof externalRef === "function") externalRef(node);
    else if (externalRef != null) {
      (externalRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
    }
  };

  const handleStep = (direction: "up" | "down") => {
    const input = innerRef.current;
    if (!input || props.disabled) return;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;

    if (direction === "up") input.stepUp();
    else input.stepDown();

    nativeInputValueSetter?.call(input, input.value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const baseClasses = cn(
    "file:text-foreground placeholder:text-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 h-9 w-full min-w-0 rounded-[15px] bg-gray-middle-light px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    "focus-visible:border",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  );

  if (type === "number") {
    return (
      <div className="relative flex items-center w-full">
        <input
          type="number"
          ref={mergedRef}
          data-slot="input"
          className={cn(
            baseClasses,
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            "pr-7",
            className,
          )}
          {...props}
        />
        <div className="absolute right-0 top-0 bottom-0 flex flex-col w-7 overflow-hidden rounded-r-[15px] border-l border-white/10">
          <button
            type="button"
            aria-label="Incrémenter"
            tabIndex={-1}
            disabled={!!props.disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              handleStep("up");
            }}
            className="flex-1 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
            <ChevronUpIcon className="size-3" />
          </button>
          <div className="h-px bg-white/10" />
          <button
            type="button"
            aria-label="Décrémenter"
            tabIndex={-1}
            disabled={!!props.disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              handleStep("down");
            }}
            className="flex-1 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
            <ChevronDownIcon className="size-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <input
      type={type}
      ref={externalRef}
      data-slot="input"
      className={cn(baseClasses, className)}
      {...props}
    />
  );
}

export { Input };
