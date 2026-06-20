import type { ReactNode } from "react";

export type SidebarActionVariant = "default" | "destructive";

export interface SidebarActionItem {
  id: string;
  label: string;
  onSelect: () => void;
  variant?: SidebarActionVariant;
  icon?: ReactNode;
}
