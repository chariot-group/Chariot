"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { NumberInput } from "@/components/ui/number-input";

function Input({ className, type, ref: externalRef, ...props }: React.ComponentProps<"input">) {
  // Numeric fields share one component (stepper, adornments, field-wide focus frame)
  if (type === "number") {
    return (
      <NumberInput
        ref={externalRef}
        className={className}
        {...props}
      />
    );
  }

  const baseClasses = cn(
    "file:text-foreground placeholder:text-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 h-9 w-full min-w-0 rounded-[15px] bg-gray-middle-light px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    "focus-visible:border",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  );

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
