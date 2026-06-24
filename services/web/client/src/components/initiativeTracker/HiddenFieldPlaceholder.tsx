"use client";

import { EyeOff } from "lucide-react";

type HiddenFieldPlaceholderProps = {
  label: string;
  className?: string;
  compact?: boolean;
};

/** FR-session-combat-navigation — indicateur visuel explicite pour une donnée masquée au joueur. */
export function HiddenFieldPlaceholder({ label, className = "", compact = false }: HiddenFieldPlaceholderProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center justify-center gap-1 rounded-full py-0.5 text-xs font-medium italic text-white/45 ${
        compact
          ? "size-8 border border-transparent bg-transparent px-0"
          : "border border-dashed border-white/20 bg-white/5 px-2"
      } ${className}`}
      aria-label={label}>
      <EyeOff
        aria-hidden="true"
        className={compact ? "size-4 shrink-0" : "size-3.5 shrink-0"}
      />
      <span className={compact ? "sr-only" : "truncate"}>{label}</span>
    </span>
  );
}
