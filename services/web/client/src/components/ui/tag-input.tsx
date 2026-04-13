"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TagInputProps {
    value: string[];
    onChange: (value: string[]) => void;
    suggestions?: string[];
    placeholder?: string;
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
}

export function TagInput({
    value = [],
    onChange,
    suggestions = [],
    placeholder = "",
    id,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedby,
}: TagInputProps) {
    const [inputValue, setInputValue] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Filter suggestions based on input and exclude already added items
    const filteredSuggestions = suggestions.filter(
        (suggestion) =>
            suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
            !value.some((v) => v.toLowerCase() === suggestion.toLowerCase())
    );

    // Check if current input is a custom entry (not in suggestions and not already added)
    const trimmedInput = inputValue.trim();
    const isCustomEntry = trimmedInput.length > 0 &&
        !suggestions.some((s) => s.toLowerCase() === trimmedInput.toLowerCase()) &&
        !value.some((v) => v.toLowerCase() === trimmedInput.toLowerCase());

    // Build the complete options list: custom entry first (if exists), then filtered suggestions
    const allOptions = isCustomEntry
        ? [trimmedInput, ...filteredSuggestions]
        : filteredSuggestions;

    useEffect(() => {
        setShowSuggestions(inputValue.length > 0 && allOptions.length > 0);
    }, [inputValue, allOptions.length]);

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !value.some((v) => v.toLowerCase() === trimmedTag.toLowerCase())) {
            onChange([...value, trimmedTag]);
            setInputValue("");
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
            } else if (inputValue.trim()) {
                addTag(inputValue);
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

    return (
        <div className="relative w-full">
            {/* Tags display */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {value.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue/20 text-blue rounded-md text-sm"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeTag(index)}
                                className="hover:bg-blue/30 rounded-sm p-0.5 transition-colors cursor-pointer"
                                aria-label={`Remove ${tag}`}
                            >
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
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(inputValue.length > 0 && allOptions.length > 0)}
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
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        role="option"
                                        aria-selected={index === highlightedIndex}
                                        onClick={() => addTag(option)}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        className={`w-full cursor-pointer text-left rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none transition-[font-weight] ${index === highlightedIndex ? "font-bold" : ""
                                            } ${isCustom ? "italic" : ""}`}
                                    >
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
