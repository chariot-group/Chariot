import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GeneralSectionCardProps {
  headingId: string;
  title: ReactNode;
  accentColor: string;
  className?: string;
  /** Extra classes for the heading (e.g. `truncate`). */
  headingClassName?: string;
  /** Control shown at the end of the heading line (e.g. an in-session edit button). */
  headerAction?: ReactNode;
  children: ReactNode;
}

/**
 * Card of the General tab bento grid: a region labelled by its own heading. It is a size
 * container, so inner lists lay out by card width (`@sm:`, `@xl:`…) rather than viewport width.
 * @see FR-character-general-bento-layout
 */
export default function GeneralSectionCard({
  headingId,
  title,
  accentColor,
  className,
  headingClassName,
  headerAction,
  children,
}: GeneralSectionCardProps) {
  const heading = (
    <h2
      id={headingId}
      className={cn("text-xl sm:text-2xl font-semibold", accentColor, headingClassName)}>
      {title}
    </h2>
  );

  return (
    <Card
      className={cn("@container min-w-0 gap-3 p-4 md:px-6", className)}
      role="region"
      aria-labelledby={headingId}>
      {headerAction ? (
        <div className="flex min-w-0 items-start justify-between gap-3">
          {heading}
          {headerAction}
        </div>
      ) : (
        heading
      )}
      {children}
    </Card>
  );
}
