"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CodexResultRowProps {
  name: string;
  meta: ReactNode;
  /** Rendered before the name (e.g. pinned language flag). Interactive content must be raised with `relative z-10`. */
  leading?: ReactNode;
  /** Rendered on the right (e.g. Chariot / SRD badges). */
  badges?: ReactNode;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Selectable Codex search result: plain row without resting background, neutral gray hover and selection.
 * A full-size overlay button handles mouse and keyboard selection, so inline InfoTooltips (raised above it)
 * are not nested inside another interactive element.
 * @see docs/design.md §5.5
 */
export default function CodexResultRow({ name, meta, leading, badges, isSelected, onSelect }: CodexResultRowProps) {
  const nameId = useId();
  const metaId = useId();

  return (
    <div
      className={cn(
        "relative flex items-start gap-2 rounded-[10px] px-3 py-2 transition-colors hover:bg-white/10 has-[>button:focus-visible]:ring-2 has-[>button:focus-visible]:ring-ring",
        isSelected && "bg-white/15 hover:bg-white/15",
      )}>
      <button
        type="button"
        aria-pressed={isSelected}
        aria-labelledby={nameId}
        aria-describedby={metaId}
        onClick={onSelect}
        className="absolute inset-0 cursor-pointer rounded-[10px] focus-visible:outline-none"
      />
      {leading}
      <div className="min-w-0 flex-1">
        <div
          id={nameId}
          className={cn("text-sm font-semibold leading-tight md:text-base", isSelected && "text-white")}>
          {name}
        </div>
        <div
          id={metaId}
          className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
          {meta}
        </div>
      </div>
      {badges ? <div className="flex shrink-0 gap-1.5">{badges}</div> : null}
    </div>
  );
}
