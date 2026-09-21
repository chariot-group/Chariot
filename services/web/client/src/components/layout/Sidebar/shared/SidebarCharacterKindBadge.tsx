"use client";

import { cn } from "@/lib/utils";

interface SidebarCharacterKindBadgeProps {
  label: string;
  selected?: boolean;
}

export function SidebarCharacterKindBadge({ label, selected = false }: SidebarCharacterKindBadgeProps) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        selected ? "bg-black/10 text-black/80" : "bg-white/10 text-white/80",
      )}>
      {label}
    </span>
  );
}
