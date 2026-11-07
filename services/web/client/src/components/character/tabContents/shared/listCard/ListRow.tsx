import { Fragment, type ReactNode } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface ListRowProps {
  value: string;
  /** DOM id of the row (scroll target on Add). */
  id?: string;
  /** DOM id of the trigger (focus target after Delete). */
  triggerId?: string;
  name: ReactNode;
  /** Muted summary, already filtered: parts joined with " · " (line) or shown as pills. */
  meta?: ReactNode[];
  metaStyle?: RowMetaStyle;
  /** Accessible name of the trigger. */
  triggerLabel: string;
  isOpen: boolean;
  hasError?: boolean;
  /** Control shown on the row, left of the chevron (e.g. delete in edit mode). */
  trailing?: ReactNode;
  contentClassName?: string;
  /** Extra attributes of the expanded content region. */
  contentLabel?: string;
  children: ReactNode;
}

/** Muted summary as small wrapping pills (used where the list is narrow, e.g. spells). */
export function RowPills({ parts }: { parts: ReactNode[] }) {
  return (
    <span className="flex min-w-0 flex-wrap gap-1">
      {parts.map((part, index) => (
        <span
          key={index}
          className="max-w-full truncate rounded-full bg-gray-middle-light px-2 py-0.5 text-xs font-normal text-card-foreground/80">
          {part}
        </span>
      ))}
    </span>
  );
}

/** Summary line or pills under the row name. */
export function RowSummary({ parts, style = "line" }: { parts?: ReactNode[]; style?: RowMetaStyle }) {
  if (!parts || parts.length === 0) return null;
  return style === "pills" ? <RowPills parts={parts} /> : <RowMeta parts={parts} />;
}

export type RowMetaStyle = "line" | "pills";

/** Separator-joined muted summary line. */
export function RowMeta({ parts }: { parts: ReactNode[] }) {
  return (
    <span className="flex min-w-0 items-center gap-x-1.5 overflow-hidden whitespace-nowrap text-xs font-normal text-muted-foreground sm:text-sm">
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 && <span aria-hidden="true">·</span>}
          <span className="min-w-0 truncate last:shrink">{part}</span>
        </Fragment>
      ))}
    </span>
  );
}

/**
 * Plain row of a list card: name + muted summary when collapsed, details or form when expanded.
 * @see FR-character-list-card
 */
export default function ListRow({
  value,
  id,
  triggerId,
  name,
  meta,
  metaStyle = "line",
  triggerLabel,
  isOpen,
  hasError = false,
  trailing,
  contentClassName,
  contentLabel,
  children,
}: ListRowProps) {
  return (
    <AccordionItem
      id={id}
      value={value}
      className={cn(
        "border-b border-border data-[state=open]:rounded-[10px] data-[state=open]:bg-gray-middle-light/30",
        hasError && "rounded-[10px] border-transparent ring-2 ring-destructive",
      )}>
      <div className="flex min-w-0 items-center gap-1 rounded-[10px] hover:bg-gray-middle-light/50">
        <div className="min-w-0 flex-1">
          <AccordionTrigger
            id={triggerId}
            className="min-w-0 w-full items-center gap-2 rounded-[10px] px-2 py-2.5 text-left hover:font-medium hover:no-underline [&>svg]:translate-y-0"
            aria-label={triggerLabel}>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span
                className={cn(
                  "min-w-0 text-sm font-semibold leading-tight sm:text-base",
                  isOpen ? "whitespace-normal wrap-break-word" : "truncate",
                )}>
                {name}
              </span>
              <RowSummary
                parts={meta}
                style={metaStyle}
              />
            </span>
          </AccordionTrigger>
        </div>
        {trailing && <div className="shrink-0 pr-1">{trailing}</div>}
      </div>
      <AccordionContent
        className={cn("px-2 pb-3 text-sm sm:text-base", contentClassName)}
        role="region"
        // A custom trigger id replaces Radix's one: point the region back to the real trigger.
        aria-labelledby={triggerId}
        aria-label={contentLabel}>
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
