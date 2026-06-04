"use client";

import { EyeOff } from "lucide-react";

type HiddenFieldPlaceholderProps = {
  label: string;
  className?: string;
};

/** FR-015 — indicateur visuel explicite pour une donnée masquée au joueur. */
export function HiddenFieldPlaceholder({ label, className = "" }: HiddenFieldPlaceholderProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center justify-center gap-1 rounded-full border border-dashed border-white/20 bg-white/5 px-2 py-0.5 text-xs font-medium italic text-white/45 ${className}`}
      aria-label={label}>
      <EyeOff
        aria-hidden="true"
        className="size-3 shrink-0"
      />
      <span className="truncate">{label}</span>
    </span>
  );
}
