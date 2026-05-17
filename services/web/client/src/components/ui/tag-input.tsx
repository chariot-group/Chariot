"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  allowCustomValues?: boolean;
  placeholder?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function TagInput({
  value = [],
  onChange,
  suggestions = [],
  allowCustomValues = true,
  placeholder = "",
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSuggestionsDismissed, setIsSuggestionsDismissed] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input and exclude already added items
  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.some((v) => v.toLowerCase() === suggestion.toLowerCase()),
  );

  // Check if current input is a custom entry (not in suggestions and not already added)
  const trimmedInput = inputValue.trim();
  const isCustomEntry =
    allowCustomValues &&
    trimmedInput.length > 0 &&
    !suggestions.some((s) => s.toLowerCase() === trimmedInput.toLowerCase()) &&
    !value.some((v) => v.toLowerCase() === trimmedInput.toLowerCase());

  // Build the complete options list: custom entry first (if exists), then filtered suggestions
  const allOptions = isCustomEntry ? [trimmedInput, ...filteredSuggestions] : filteredSuggestions;
  const showSuggestions = isInputFocused && !isSuggestionsDismissed && inputValue.length > 0 && allOptions.length > 0;

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    const matchesSuggestion = suggestions.some((s) => s.toLowerCase() === trimmedTag.toLowerCase());

    if (
      trimmedTag &&
      (allowCustomValues || matchesSuggestion) &&
      !value.some((v) => v.toLowerCase() === trimmedTag.toLowerCase())
    ) {
      onChange([...value, trimmedTag]);
      setInputValue("");
      setIsSuggestionsDismissed(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < allOptions.length) {
        addTag(allOptions[highlightedIndex]);
      } else if (allowCustomValues && inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < allOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setIsSuggestionsDismissed(true);
      setHighlightedIndex(-1);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionsRef.current) {
      const highlightedElement = suggestionsRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex]);

  // Ensure suggestions dropdown stays visible when it opens
  useEffect(() => {
    if (!showSuggestions || !suggestionsRef.current || !inputRef.current) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      const scrollContainer = document.getElementById("characterScrollView");
      const input = inputRef.current;
      const dropdown = suggestionsRef.current;
      if (!input || !dropdown || !scrollContainer) {
        return;
      }

      const containerRect = scrollContainer.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      const margin = 12;

      if (dropdownRect.bottom > containerRect.bottom) {
        const delta = dropdownRect.bottom - containerRect.bottom + margin;
        scrollContainer.scrollBy({ top: delta, behavior: "smooth" });
      }
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [showSuggestions]);

  return (
    <div className="relative w-full">
      {/* Tags display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue/20 text-blue rounded-[15px] text-sm">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="hover:bg-blue/30 rounded-[15px] p-0.5 transition-colors cursor-pointer"
                aria-label={`Remove ${tag}`}>
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          className="cursor-pointer"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsSuggestionsDismissed(false);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsInputFocused(true);
            setIsSuggestionsDismissed(false);
          }}
          onBlur={() => setIsInputFocused(false)}
          placeholder={placeholder}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedby}
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={showSuggestions ? `${id}-suggestions` : undefined}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div
            ref={suggestionsRef}
            id={`${id}-suggestions`}
            role="listbox"
            className="absolute z-50 w-full mt-1 bg-gray-middle-light rounded-[15px] border shadow-md max-h-60 overflow-y-auto animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
            <div className="p-1">
              {allOptions.map((option, index) => {
                const isCustom = index === 0 && isCustomEntry;
                return (
                  <button
                    key={index}
                    type="button"
                    role="option"
                    aria-selected={index === highlightedIndex}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addTag(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full my-0.5 cursor-pointer text-left rounded-[15px] py-1.5 pr-8 pl-2 text-sm outline-hidden select-none transition-[font-weight,color,background-color] ${
                      index === highlightedIndex ? " bg-white/10 text-white" : ""
                    } ${isCustom ? "italic" : ""}`}>
                    {option}
                    {isCustom && <span className="mx-1">(custom)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
