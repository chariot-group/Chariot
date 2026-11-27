"use client";

import { cn } from "@/lib/utils";

/** Accent of the builder card headings (docs/design.md §5.3: section cards hold an accent-colored heading). */
export const BUILDER_CARD_TITLE_CLASS = "text-lg font-semibold text-primary-light";

/**
 * Card of the character builder: a region labelled by its own accent heading, with an optional secondary line
 * (e.g. « via Nain ») and an aside (counter).
 * @see FR-ruleset-character-builder — Web builder UI (Layout)
 */
export function BuilderCard({
  headingId,
  title,
  subtitle,
  aside,
  describedBy,
  className,
  children,
}: {
  headingId: string;
  /** Ids of the help and messages of the card (field level). */
  describedBy?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={describedBy}
      className={cn("flex min-w-0 flex-col gap-3 rounded-[15px] border border-input bg-card p-4 sm:p-5", className)}>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            id={headingId}
            className={BUILDER_CARD_TITLE_CLASS}>
            {title}
          </h3>
          {subtitle ? <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p> : null}
        </div>
        {aside ? <div className="shrink-0 text-xs text-muted-foreground">{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Frame of a builder field: its own titled card, or a sub-section (smaller heading, no frame) when the field sits
 * in a step card grouping several fields.
 */
export function BuilderFieldFrame({
  embedded,
  headingId,
  title,
  subtitle,
  aside,
  describedBy,
  children,
}: {
  embedded: boolean;
  headingId: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  aside?: React.ReactNode;
  describedBy?: string;
  children: React.ReactNode;
}) {
  if (!embedded) {
    return (
      <BuilderCard
        headingId={headingId}
        title={title}
        subtitle={subtitle}
        aside={aside}
        describedBy={describedBy}>
        {children}
      </BuilderCard>
    );
  }
  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={describedBy}
      className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4
            id={headingId}
            className="text-sm font-medium text-white">
            {title}
          </h4>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {aside ? <div className="shrink-0 text-xs text-muted-foreground">{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}

/** Screen-reader mention of a required field (no visual asterisk, like the other forms). */
export function RequiredMention({ required, label }: { required: boolean; label: string }) {
  return required ? <span className="sr-only"> ({label})</span> : null;
}
