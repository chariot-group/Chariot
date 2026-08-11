import * as React from "react";
import { cn } from "@/lib/utils";
import {
  TRACKER_CELL_ALIGN,
  TRACKER_GRID_CELL_GUARDRAIL_CLASS,
} from "@/components/initiativeTracker/constants";

type TrackerGridCellAlign = keyof typeof TRACKER_CELL_ALIGN;

type TrackerGridCellProps = {
  children: React.ReactNode;
  align?: TrackerGridCellAlign;
  className?: string;
  as?: "div" | "span";
};

/** FR-combat-initiative-tracker — enveloppe de cellule grille avec garde-fou anti-chevauchement. */
export function TrackerGridCell({
  children,
  align,
  className,
  as: Component = "div",
}: TrackerGridCellProps) {
  return (
    <Component
      data-tracker-grid-cell=""
      data-tracker-grid-cell-align={align}
      className={cn(
        TRACKER_GRID_CELL_GUARDRAIL_CLASS,
        align ? TRACKER_CELL_ALIGN[align] : null,
        className,
      )}>
      {children}
    </Component>
  );
}
