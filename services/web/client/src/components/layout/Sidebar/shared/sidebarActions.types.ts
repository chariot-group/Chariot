import type { ReactNode } from "react";

export type SidebarActionVariant = "default" | "destructive";

export interface SidebarActionItem {
  id: string;
  label: string;
  onSelect: () => void;
  variant?: SidebarActionVariant;
  icon?: ReactNode;
  /** When true, the action is grayed out and not selectable. @see FR-character-sheet-pdf-export */
  disabled?: boolean;
  /** Shown on hover/focus when `disabled` is true (e.g. coming soon). */
  disabledTooltip?: string;
}
