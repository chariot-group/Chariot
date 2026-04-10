import * as React from "react";

import { cn } from "@/lib/utils";
import { isEnterWithModifiers, isEnterWithoutModifiers } from "@/utils/keyboard.utils";

function Textarea({ className, onKeyDown, ...props }: React.ComponentProps<"textarea">) {
  const insertNewLine = React.useCallback((textarea: HTMLTextAreaElement) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${textarea.value.slice(0, start)}\n${textarea.value.slice(end)}`;

    textarea.value = nextValue;
    textarea.selectionStart = start + 1;
    textarea.selectionEnd = start + 1;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }, []);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (isEnterWithModifiers(event)) {
        event.preventDefault();
        insertNewLine(event.currentTarget);
        event.stopPropagation();
        return;
      }

      if (isEnterWithoutModifiers(event)) {
        event.preventDefault();
        event.currentTarget.form?.requestSubmit();
        return;
      }

      onKeyDown?.(event);
    },
    [insertNewLine, onKeyDown],
  );

  return (
    <textarea
      data-slot="textarea"
      onKeyDown={handleKeyDown}
      className={cn(
        "border-input bg-gray-middle-light placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-[15px] px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
