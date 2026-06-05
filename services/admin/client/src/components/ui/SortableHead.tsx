"use client";

import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

interface SortableHeadProps<T extends string> {
  field: T;
  sortField: T | null;
  sortDir: "asc" | "desc";
  onToggle: (field: T) => void;
  children: React.ReactNode;
}

export function SortableHead<T extends string>({
  field,
  sortField,
  sortDir,
  onToggle,
  children,
}: SortableHeadProps<T>) {
  const active = sortField === field;
  const Icon = active ? (sortDir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => onToggle(field)}>
      {children}
      <Icon className="h-3 w-3 opacity-60" />
    </button>
  );
}
