"use client";

import { useState, useRef, useEffect, useLayoutEffect, KeyboardEvent, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getComboboxSuggestionsStyle } from "@/utils/combobox-suggestions.utils";

interface ComboboxInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function ComboboxInput({
  value = "",
  onChange,
  suggestions = [],
  placeholder = "",
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
}: ComboboxInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const [isMounted, setIsMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const isSelectingOptionRef = useRef(false);
  const canShowSuggestionsRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter suggestions based on input
  const filteredSuggestions =
    inputValue.trim().length > 0
      ? suggestions.filter((suggestion) => suggestion.toLowerCase().includes(inputValue.toLowerCase()))
      : suggestions;

  // Check if current input is a custom entry (not in suggestions)
  const trimmedInput = inputValue.trim();
  const isCustomEntry =
    trimmedInput.length > 0 && !suggestions.some((s) => s.toLowerCase() === trimmedInput.toLowerCase());

  // Build the complete options list: custom entry first (if exists), then filtered suggestions
  const allOptions = isCustomEntry ? [trimmedInput, ...filteredSuggestions] : filteredSuggestions;

  useEffect(() => {
    if (isSelectingOptionRef.current) return;
    if (!canShowSuggestionsRef.current) return;
    if (document.activeElement !== inputRef.current) return;
    setShowSuggestions(inputValue.length > 0 && allOptions.length > 0);
  }, [inputValue, allOptions.length]);

  const updateDropdownPosition = () => {
    const input = inputRef.current;
    if (!input) return;
    setDropdownStyle(getComboboxSuggestionsStyle(input.getBoundingClientRect(), window.innerHeight));
  };

  useLayoutEffect(() => {
    if (!showSuggestions) return;
    updateDropdownPosition();

    const handleReposition = () => updateDropdownPosition();
    window.addEventListener("resize", handleReposition);
    // Capture scroll from nested overflow containers (accordion cards, sheet scroll views).
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [showSuggestions, allOptions.length]);

  const selectOption = (option: string) => {
    isSelectingOptionRef.current = true;
    canShowSuggestionsRef.current = false;
    onChange(option);
    setInputValue(option);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < allOptions.length) {
        selectOption(allOptions[highlightedIndex]);
      } else if (inputValue.trim()) {
        selectOption(inputValue.trim());
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < allOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleBlur = () => {
    // Delay to allow click on suggestion to register
    setTimeout(() => {
      if (isSelectingOptionRef.current) {
        isSelectingOptionRef.current = false;
        return;
      }

      canShowSuggestionsRef.current = false;
      setShowSuggestions(false);
      setHighlightedIndex(-1);

      const latestInput = inputRef.current?.value.trim() ?? inputValue.trim();
      // If input is different from value, update the value
      if (latestInput && latestInput !== value) {
        onChange(latestInput);
      }
    }, 200);
  };

  const handleInputClick = () => {
    canShowSuggestionsRef.current = true;
    setShowSuggestions(inputValue.length > 0 && allOptions.length > 0);
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionsRef.current) {
      const highlightedElement = suggestionsRef.current.querySelector<HTMLElement>(
        `[data-combobox-option-index="${highlightedIndex}"]`,
      );
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex]);

  const suggestionsListId = id ? `${id}-suggestions` : "combobox-suggestions";

  const suggestionsDropdown =
    showSuggestions && isMounted
      ? createPortal(
          <div
            ref={suggestionsRef}
            id={suggestionsListId}
            role="listbox"
            style={dropdownStyle}
            className="z-100 bg-gray-middle-light rounded-[15px] border shadow-md overflow-y-auto animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
            <div className="p-1">
              {allOptions.map((option, index) => {
                const isCustom = index === 0 && isCustomEntry;
                const isSelected = option === value;
                return (
                  <button
                    key={`${option}-${index}`}
                    type="button"
                    role="option"
                    data-combobox-option-index={index}
                    aria-selected={index === highlightedIndex}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectOption(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full my-0.5 cursor-pointer text-left rounded-[15px] py-1.5 pr-8 pl-2 text-sm outline-hidden select-none transition-[font-weight,color,background-color] flex items-center justify-between ${
                      index === highlightedIndex ? "bg-white/10 text-white" : isSelected ? "bg-white/15 text-white" : ""
                    } ${isCustom ? "italic" : ""}`}>
                    <span>
                      {option}
                      {isCustom && <span className="mx-1">(custom)</span>}
                    </span>
                    {isSelected && (
                      <Check
                        size={16}
                        className="text-blue"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          className="cursor-pointer"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={handleInputClick}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedby}
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={showSuggestions ? suggestionsListId : undefined}
        />
      </div>
      {suggestionsDropdown}
    </div>
  );
}
