"use client";

import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { ResolvedEntry } from "@/lib/rulesetEngine/types";

/**
 * Radio or checkbox list of catalog options. The whole option card is clickable and hoverable (stretched label);
 * the description stays on demand above it. Native radios keep the arrow-key navigation of a radio group.
 * @see FR-ruleset-character-builder — Web builder UI (Fields, Layout, Accessibility)
 */
export function BuilderOptionList({
  name,
  options,
  selected,
  multiple,
  labelledBy,
  describedBy,
  invalid,
  onChange,
}: {
  name: string;
  options: ResolvedEntry[];
  selected: readonly string[];
  multiple: boolean;
  labelledBy?: string;
  describedBy?: string;
  invalid?: boolean;
  onChange: (key: string, checked: boolean) => void;
}) {
  const t = useTranslations("characterBuilder");
  if (!options.length) return <p className="text-sm text-muted-foreground">{t("noOption")}</p>;
  return (
    <div
      role={multiple ? "group" : "radiogroup"}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => {
          const id = `${name}-${option.key}`;
          const checked = selected.includes(option.key);
          return (
            <li
              key={option.key}
              className={cn(
                "relative flex min-w-0 flex-col gap-1 rounded-[13px] border border-input bg-gray-middle-light px-3 py-2 transition-colors hover:bg-gray hover:border-ring has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring has-[button[role=checkbox]:focus-visible]:ring-2 has-[button[role=checkbox]:focus-visible]:ring-ring",
                checked && "border-primary-light bg-primary/15",
              )}>
              <div className="flex min-w-0 items-center gap-3">
                {multiple ? (
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(value) => onChange(option.key, value === true)}
                  />
                ) : (
                  <input
                    id={id}
                    type="radio"
                    name={name}
                    value={option.key}
                    checked={checked}
                    onChange={() => onChange(option.key, true)}
                    className="size-4 shrink-0 cursor-pointer accent-[var(--primary-light)] focus-visible:outline-none"
                  />
                )}
                {/* Stretched label: the whole card toggles the option. */}
                <label
                  htmlFor={id}
                  className="min-w-0 flex-1 cursor-pointer break-words text-sm font-medium text-white after:absolute after:inset-0 after:rounded-[13px] after:content-['']">
                  {option.label}
                </label>
              </div>
              {/* Only the toggle and the open text sit above the stretched label: the rest of the card selects. */}
              {option.description ? (
                <details className="pl-7 text-xs text-muted-foreground sm:text-sm">
                  <summary className="relative z-10 w-fit cursor-pointer rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {t("details")}
                    <span className="sr-only"> : {option.label}</span>
                  </summary>
                  <p className="relative z-10 mt-1 whitespace-pre-wrap wrap-break-word">{option.description}</p>
                </details>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
