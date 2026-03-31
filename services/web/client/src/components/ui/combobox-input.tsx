"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";

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
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const isSelectingOptionRef = useRef(false);

    // Sync input value with prop value
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Filter suggestions based on input
    const filteredSuggestions = inputValue.trim().length > 0
        ? suggestions.filter((suggestion) =>
            suggestion.toLowerCase().includes(inputValue.toLowerCase())
        )
        : suggestions;

    // Check if current input is a custom entry (not in suggestions)
    const trimmedInput = inputValue.trim();
    const isCustomEntry = trimmedInput.length > 0 &&
        !suggestions.some((s) => s.toLowerCase() === trimmedInput.toLowerCase());

    // Build the complete options list: custom entry first (if exists), then filtered suggestions
    const allOptions = isCustomEntry
        ? [trimmedInput, ...filteredSuggestions]
        : filteredSuggestions;

    useEffect(() => {
        if (isSelectingOptionRef.current) return;
        setShowSuggestions(inputValue.length > 0 && allOptions.length > 0);
    }, [inputValue, allOptions.length]);

    const selectOption = (option: string) => {
        isSelectingOptionRef.current = true;
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
            setHighlightedIndex((prev) =>
                prev < allOptions.length - 1 ? prev + 1 : prev
            );
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

            setShowSuggestions(false);
            setHighlightedIndex(-1);

            const latestInput = inputRef.current?.value.trim() ?? inputValue.trim();
            // If input is different from value, update the value
            if (latestInput && latestInput !== value) {
                onChange(latestInput);
            }
        }, 200);
    };

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && suggestionsRef.current) {
            const highlightedElement = suggestionsRef.current.children[0]?.children[highlightedIndex] as HTMLElement;
            if (highlightedElement) {
                highlightedElement.scrollIntoView({
                    block: "nearest",
                    behavior: "smooth",
                });
            }
        }
    }, [highlightedIndex]);

    return (
        <div className="relative w-full">
            {/* Input field */}
            <div className="relative">
                <Input
                    ref={inputRef}
                    id={id}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(inputValue.length > 0 && allOptions.length > 0)}
                    onBlur={handleBlur}
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
                        className="absolute z-50 w-full mt-1 bg-gray-middle-light rounded-[15px] border shadow-md max-h-60 overflow-y-auto animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
                    >
                        <div className="p-1">
                            {allOptions.map((option, index) => {
                                const isCustom = index === 0 && isCustomEntry;
                                const isSelected = option === value;
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        role="option"
                                        aria-selected={index === highlightedIndex}
                                        onClick={() => selectOption(option)}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        className={`w-full text-left rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none transition-[font-weight] flex items-center justify-between ${index === highlightedIndex ? "font-bold" : ""
                                            } ${isCustom ? "italic" : ""}`}
                                    >
                                        <span>
                                            {option}
                                            {isCustom && <span className="mx-1">(custom)</span>}
                                        </span>
                                        {isSelected && <Check size={16} className="text-blue" />}
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
