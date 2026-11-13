"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CompanionsSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Number of companions matching the current query, announced in a polite live region. */
  resultCount: number;
}

/**
 * Live search field of the Companions tab toolbar (Escape clears it).
 * @see FR-npc-player-link — Companions tab search
 */
export function CompanionsSearchField({ value, onChange, resultCount }: CompanionsSearchFieldProps) {
  const t = useTranslations("characterDetail.companions");
  const inputId = useId();
  const hasQuery = value.trim().length > 0;

  return (
    <div className="relative w-full min-w-0 sm:w-72">
      <label
        htmlFor={inputId}
        className="sr-only">
        {t("searchLabel")}
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/60"
        aria-hidden="true"
      />
      <Input
        id={inputId}
        type="search"
        value={value}
        autoComplete="off"
        placeholder={t("searchPlaceholder")}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value.length > 0) {
            event.preventDefault();
            event.stopPropagation();
            onChange("");
          }
        }}
        className="pr-9 pl-9 placeholder:text-white/60 [&::-webkit-search-cancel-button]:hidden"
      />
      {value.length > 0 ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("searchClear")}
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:outline-none">
          <X
            className="size-4"
            aria-hidden="true"
          />
        </button>
      ) : null}
      <p
        className="sr-only"
        aria-live="polite"
        aria-atomic="true">
        {hasQuery ? t("searchResultCount", { count: resultCount }) : ""}
      </p>
    </div>
  );
}
