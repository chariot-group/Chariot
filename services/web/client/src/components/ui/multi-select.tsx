"use client";

import * as React from "react";
import { CheckIcon, MinusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MultiSelectOption = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  selectAllLabel?: string;
  className?: string;
}

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  selectAllLabel,
  className,
}: MultiSelectProps) {
  const t = useTranslations("multiSelect");
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const closeTimeoutRef = React.useRef<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const shouldOpenOnFocusRef = React.useRef(false);

  const selectedValues = React.useMemo(() => new Set(value), [value]);

  const filteredOptions = React.useMemo(() => {
    const normalizedSearch = query.trim().toLowerCase();
    if (!normalizedSearch) {
      return options;
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalizedSearch));
  }, [options, query]);

  const selectedOptions = React.useMemo(
    () => options.filter((option) => selectedValues.has(option.value)),
    [options, selectedValues],
  );

  const toggleValue = (nextValue: string) => {
    if (selectedValues.has(nextValue)) {
      onChange(value.filter((currentValue) => currentValue !== nextValue));
      return;
    }

    onChange([...value, nextValue]);
  };

  const updateOpenState = React.useCallback(
    (nextQuery: string) => {
      const normalizedQuery = nextQuery.trim().toLowerCase();
      const nextFilteredOptions =
        normalizedQuery.length === 0
          ? options
          : options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));

      setOpen(nextFilteredOptions.length > 0);
    },
    [options],
  );

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    updateOpenState(nextQuery);
  };

  const handleFocus = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (shouldOpenOnFocusRef.current) {
      updateOpenState(query);
    }

    shouldOpenOnFocusRef.current = false;
  };

  const handleBlur = () => {
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
    }, 120);
  };

  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const handlePointerDownOutside = (event: PointerEvent) => {
      if (!containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside);
    };
  }, []);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "Enter" && filteredOptions.length > 0) {
      event.preventDefault();
      toggleValue(filteredOptions[0].value);
    }
  };

  const handleOptionPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    // Keep focus on the input so the menu stays interactive while selecting multiple groups.
    event.preventDefault();
  };

  const hasSelectedOptions = selectedOptions.length > 0;

  const allFilteredSelected =
    filteredOptions.length > 0 && filteredOptions.every((option) => selectedValues.has(option.value));
  const someFilteredSelected = filteredOptions.some((option) => selectedValues.has(option.value));

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredValues = new Set(filteredOptions.map((o) => o.value));
      onChange(value.filter((v) => !filteredValues.has(v)));
    } else {
      const filteredValues = filteredOptions.map((o) => o.value);
      onChange([...value, ...filteredValues.filter((v) => !selectedValues.has(v))]);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full">
      <div
        className={cn(
          "flex w-full items-center gap-2 rounded-[15px] bg-gray-middle-light px-3 py-2 shadow-xs",
          className,
        )}>
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onPointerDown={() => {
            shouldOpenOnFocusRef.current = true;
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleInputKeyDown}
          placeholder={searchPlaceholder ?? placeholder ?? t("searchPlaceholder")}
          className="h-auto bg-transparent px-0 py-0 text-sm shadow-none focus-visible:border-none focus-visible:ring-none"
        />
      </div>

      {open && (
        <div className="absolute top-[calc(100%+0.25rem)] z-50 w-[min(32rem,calc(100vw-3rem))] rounded-[15px] border bg-gray-middle-light p-3 shadow-md">
          <div
            className="space-y-3"
            onKeyDown={(event) => event.stopPropagation()}>
            {selectAllLabel && filteredOptions.length > 0 && (
              <div
                role="button"
                tabIndex={0}
                onPointerDown={handleOptionPointerDown}
                onClick={handleSelectAll}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSelectAll();
                  }
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-3 rounded-[15px] px-2 py-2 pb-3 text-left text-sm font-medium transition-colors hover:bg-white/10",
                  allFilteredSelected && "text-white",
                )}>
                <span className="truncate">{selectAllLabel}</span>
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                    allFilteredSelected
                      ? "border-white bg-white text-black"
                      : someFilteredSelected
                        ? "border-white bg-white/30 text-white"
                        : "border-white/30",
                  )}
                  aria-hidden="true">
                  {allFilteredSelected && <CheckIcon className="size-3" />}
                  {!allFilteredSelected && someFilteredSelected && <MinusIcon className="size-3" />}
                </span>
              </div>
            )}

            {selectedOptions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedOptions.map((option) => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-1 rounded-[15px] bg-white/10 px-2 py-1 text-sm text-white">
                    <span className="max-w-48 truncate">{option.label}</span>
                    <button
                      type="button"
                      onPointerDown={handleOptionPointerDown}
                      onClick={() => toggleValue(option.value)}
                      className="cursor-pointer rounded-full p-0.5 transition-colors hover:bg-white/10"
                      aria-label={t("removeOption", { label: option.label })}>
                      <XIcon className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
              {filteredOptions.length === 0 ? (
                <p className="px-2 py-2 text-sm text-muted-foreground">{emptyText ?? t("emptyText")}</p>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedValues.has(option.value);

                  return (
                    <div
                      key={option.value}
                      role="button"
                      tabIndex={0}
                      onPointerDown={handleOptionPointerDown}
                      onClick={() => toggleValue(option.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleValue(option.value);
                        }
                      }}
                      className={cn(
                        "flex w-full cursor-pointer items-center justify-between gap-3 rounded-[15px] px-2 py-2 text-left text-sm transition-colors hover:bg-white/10",
                        isSelected && "bg-white/10 text-white",
                      )}>
                      <span className="truncate">{option.label}</span>
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                          isSelected ? "border-white bg-white text-black" : "border-white/30",
                        )}
                        aria-hidden="true">
                        {isSelected && <CheckIcon className="size-3" />}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {hasSelectedOptions && (
              <p className="px-1 text-xs text-muted-foreground">
                {t("selectedCount", { count: selectedOptions.length })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
