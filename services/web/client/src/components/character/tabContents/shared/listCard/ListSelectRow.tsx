import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RowSummary, type RowMetaStyle } from "@/components/character/tabContents/shared/listCard/ListRow";

interface ListSelectRowProps {
  /** DOM id of the row button. */
  id?: string;
  name: ReactNode;
  /** Muted one-line summary, already filtered: parts are joined with " · ". */
  meta?: ReactNode[];
  metaStyle?: RowMetaStyle;
  /** Accessible name of the row button. */
  label: string;
  isSelected: boolean;
  /** Error ring (edit mode, invalid item). */
  hasError?: boolean;
  onSelect: () => void;
  /** Control shown on the row, right of the button (e.g. prepared marker). */
  trailing?: ReactNode;
  /** Id of the panel showing the selected item. */
  controlsId?: string;
}

/**
 * Selectable row of a list card (list + detail panel layouts): same look as a `ListRow`, but
 * selecting shows the item in a side panel instead of expanding in place. Focus stays on the row.
 * @see FR-character-list-card, FR-character-magic-list-card
 */
export default function ListSelectRow({
  id,
  name,
  meta,
  metaStyle = "line",
  label,
  isSelected,
  hasError = false,
  onSelect,
  trailing,
  controlsId,
}: ListSelectRowProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-1 border-b border-border",
        isSelected && "rounded-[10px] border-transparent bg-gray-middle-light/60",
        hasError && "rounded-[10px] border-transparent ring-2 ring-destructive",
      )}>
      <button
        type="button"
        id={id}
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-1 rounded-[10px] px-2 py-2.5 text-left outline-none transition-colors hover:bg-gray-middle-light/50 focus-visible:ring-2 focus-visible:ring-ring",
          isSelected && "hover:bg-transparent",
        )}
        aria-label={label}
        aria-pressed={isSelected}
        aria-controls={controlsId}
        onClick={onSelect}>
        <span className="min-w-0 truncate text-sm font-semibold leading-tight sm:text-base">{name}</span>
        <RowSummary
          parts={meta}
          style={metaStyle}
        />
      </button>
      {trailing && <div className="shrink-0 pt-2 pr-1">{trailing}</div>}
    </div>
  );
}
