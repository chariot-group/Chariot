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
        "flex min-w-0 items-center gap-1 rounded-[10px] border-b border-border transition-colors",
        !isSelected && "hover:bg-gray-middle-light/25",
        // Inset rings: an outer ring is covered by the sticky group header above the first row.
        isSelected && "rounded-[10px] border-transparent bg-gray-middle-light ring-1 ring-inset ring-white/50",
        hasError && "rounded-[10px] border-transparent ring-2 ring-inset ring-destructive",
      )}>
      <button
        type="button"
        id={id}
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-1 rounded-[10px] px-2 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !isSelected && "cursor-pointer",
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
      {/* No chevron after the trailing control here: pad it like the row's left inset. */}
      {trailing && <div className="shrink-0 pr-3">{trailing}</div>}
    </div>
  );
}
