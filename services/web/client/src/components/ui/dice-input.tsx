"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { menuItemClassName, menuSurfaceClassName } from "@/components/ui/menu-styles";
import { getComboboxSuggestionsStyle } from "@/utils/combobox-suggestions.utils";
import { getDiceSuggestions } from "@/utils/dice-suggestions.utils";

interface DiceInputProps {
  id: string;
  value: string;
  /** Called on every keystroke, like a plain input (the AUTO bonus is applied live). */
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Accessible name of the suggestions list. */
  suggestionsLabel: string;
}

/**
 * Free-text dice field with non-blocking dice suggestions (`2d` → `2d4` … `2d12`). Choosing a suggestion
 * fills the field and keeps the focus so a bonus can follow; any other text stays accepted as typed.
 * @see FR-character-list-card
 */
export function DiceInput({ id, value, onChange, placeholder, className, suggestionsLabel }: DiceInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const [isMounted, setIsMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = getDiceSuggestions(value);
  const isExpanded = isOpen && suggestions.length > 0;
  const listId = `${id}-dice-suggestions`;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isExpanded) return;
    const reposition = () => {
      const input = inputRef.current;
      if (input) setDropdownStyle(getComboboxSuggestionsStyle(input.getBoundingClientRect(), window.innerHeight));
    };
    reposition();
    window.addEventListener("resize", reposition);
    // Capture scroll from nested overflow containers (list card rows, sheet scroll views).
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [isExpanded]);

  const close = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const select = (suggestion: string) => {
    onChange(suggestion);
    close();
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isExpanded) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, -1));
    } else if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      select(suggestions[highlightedIndex]);
    } else if (event.key === "Escape") {
      close();
    }
  };

  return (
    <>
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onBlur={close}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isExpanded}
        aria-controls={isExpanded ? listId : undefined}
        aria-activedescendant={isExpanded && highlightedIndex >= 0 ? `${listId}-${highlightedIndex}` : undefined}
      />
      {isExpanded &&
        isMounted &&
        createPortal(
          <div
            id={listId}
            role="listbox"
            aria-label={suggestionsLabel}
            style={dropdownStyle}
            className={cn(menuSurfaceClassName, "z-100 overflow-y-auto p-1.5")}>
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === highlightedIndex}
                // Keep the focus in the field: the suggestion is applied on click.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(menuItemClassName, "cursor-pointer", index === highlightedIndex && "bg-white/10")}>
                {suggestion}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
