"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  label: string;
  value: string;
};

interface SearchableSelectProps {
  value: string | null;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  id?: string;
  "aria-labelledby"?: string;
  className?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  id,
  "aria-labelledby": ariaLabelledBy,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const shouldOpenOnFocusRef = React.useRef(false);
  const listboxId = React.useId();

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const filteredOptions = React.useMemo(() => {
    const normalizedSearch = query.trim().toLowerCase();
    if (!normalizedSearch) {
      return options;
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalizedSearch));
  }, [options, query]);

  const syncQueryWithSelection = React.useCallback(() => {
    setQuery(selectedOption?.label ?? "");
  }, [selectedOption?.label]);

  React.useEffect(() => {
    if (!open) {
      syncQueryWithSelection();
    }
  }, [open, syncQueryWithSelection, value]);

  const updateOpenState = React.useCallback(
    (nextQuery: string) => {
      const normalizedQuery = nextQuery.trim().toLowerCase();
      const nextFilteredOptions =
        normalizedQuery.length === 0
          ? options
          : options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));

      setOpen(nextFilteredOptions.length > 0 || normalizedQuery.length > 0);
    },
    [options],
  );

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    updateOpenState(nextQuery);
  };

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    const option = options.find((item) => item.value === nextValue);
    setQuery(option?.label ?? "");
    setOpen(false);
  };

  const handleFocus = () => {
    if (shouldOpenOnFocusRef.current) {
      updateOpenState(query);
    }

    shouldOpenOnFocusRef.current = false;
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const relatedTarget = event.relatedTarget as Node | null;
    if (relatedTarget && containerRef.current?.contains(relatedTarget)) {
      return;
    }

    setOpen(false);
    syncQueryWithSelection();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && filteredOptions.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      selectOption(filteredOptions[0].value);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      syncQueryWithSelection();
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}>
      <div className="flex w-full items-center gap-2 rounded-[15px] bg-gray-middle-light px-3 py-2 shadow-xs">
        <Input
          ref={inputRef}
          id={id}
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onPointerDown={() => {
            shouldOpenOnFocusRef.current = true;
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-labelledby={ariaLabelledBy}
          aria-autocomplete="list"
          placeholder={searchPlaceholder ?? placeholder}
          className="h-auto rounded-none bg-transparent px-0 py-0 text-sm shadow-none focus-visible:border-none focus-visible:ring-none"
        />
      </div>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={placeholder}
          className="absolute top-[calc(100%+0.25rem)] z-50 w-full rounded-[15px] border bg-card p-2 shadow-md"
          onPointerDown={(event) => {
            event.preventDefault();
          }}>
          <div
            className="max-h-60 space-y-1 overflow-y-auto pr-1"
            onKeyDown={(event) => event.stopPropagation()}>
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      selectOption(option.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectOption(option.value);
                      }
                    }}
                    className={cn(
                      "w-full cursor-pointer rounded-[12px] px-3 py-2 text-left text-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50",
                      isSelected && "bg-white font-semibold text-black",
                    )}>
                    <span className="truncate">{option.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
