import type { ReactNode } from "react";
import { ListChevronsDownUp, ListChevronsUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BENTO_BOUNDED_LIST_CLASS } from "@/components/character/tabContents/general/shared/generalBentoLayout";

/** Taller cap of the bounded rows in edit mode, so an expanded form stays usable. */
export const EDIT_LIST_MAX_HEIGHT_CLASS = "max-h-[min(40rem,70dvh)]";

interface ListCardProps {
  headingId: string;
  title: string;
  count: number;
  accentColor: string;
  /** Layout classes (bento slot). */
  className?: string;
  /** Extra header controls, left of expand/collapse all (e.g. Add in edit mode). */
  actions?: ReactNode;
  /** Line under the title (usage-type filter, rest legend). */
  toolbar?: ReactNode;
  expanded?: boolean;
  /** Expand / collapse all; the button is hidden when omitted (rows that do not expand). */
  onToggleAll?: () => void;
  expandLabel?: string;
  collapseLabel?: string;
  emptyLabel: string;
  /** Cap the rows height and scroll inside the card (header stays outside). */
  bounded?: boolean;
  /** Overrides the bounded max height (edit mode uses a taller cap). */
  boundedClassName?: string;
  /**
   * From `xl`, the bounded rows area drops its cap and fills the card height (the card must be given
   * a definite height by its slot, e.g. a `minmax(0, 1fr)` grid row). Below `xl` the cap stays.
   * @see FR-character-magic-list-card
   */
  fill?: boolean;
  /** The rows (an `Accordion` of `ListRow`). */
  children: ReactNode;
}

/** `fill`: the card may shrink to its grid track from `xl`. */
export const LIST_CARD_FILL_CLASS = "xl:min-h-0";
/** `fill`: from `xl` the rows area takes the remaining card height instead of its cap. */
export const LIST_ROWS_FILL_CLASS = "xl:max-h-none xl:min-h-0 xl:flex-1";

/**
 * One card holding a list header and its rows (actions, abilities), read and edit modes.
 * @see FR-character-list-card
 */
export default function ListCard({
  headingId,
  title,
  count,
  accentColor,
  className,
  actions,
  toolbar,
  expanded = false,
  onToggleAll,
  expandLabel,
  collapseLabel,
  emptyLabel,
  bounded = false,
  boundedClassName,
  fill = false,
  children,
}: ListCardProps) {
  const isEmpty = count === 0;

  return (
    <Card
      className={cn("@container min-w-0 gap-3 p-4 md:px-6", fill && LIST_CARD_FILL_CLASS, className)}
      role="region"
      aria-labelledby={headingId}>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <h2
            id={headingId}
            className={cn("flex min-w-0 flex-1 items-center gap-2 text-xl font-semibold sm:text-2xl", accentColor)}>
            <span className="min-w-0 truncate">{title}</span>
            <span
              className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-gray-middle-light px-2 text-xs font-semibold leading-none tabular-nums text-card-foreground"
              aria-hidden="true">
              {count}
            </span>
          </h2>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {actions}
            {onToggleAll && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggleAll}
                disabled={isEmpty}
                className={accentColor}
                aria-label={expanded ? collapseLabel : expandLabel}
                aria-expanded={expanded}>
                {expanded ? (
                  <ListChevronsDownUp
                    className="size-5"
                    aria-hidden="true"
                  />
                ) : (
                  <ListChevronsUpDown
                    className="size-5"
                    aria-hidden="true"
                  />
                )}
              </Button>
            )}
          </div>
        </div>
        {toolbar}
      </div>
      {isEmpty ? (
        <p className="text-sm text-muted-foreground sm:text-base">{emptyLabel}</p>
      ) : bounded ? (
        <div
          className={cn(BENTO_BOUNDED_LIST_CLASS, "min-h-0 flex-1 p-0.5 pr-2", boundedClassName, fill && LIST_ROWS_FILL_CLASS)}
          role="group"
          aria-labelledby={headingId}
          tabIndex={0}>
          {children}
        </div>
      ) : (
        children
      )}
    </Card>
  );
}
