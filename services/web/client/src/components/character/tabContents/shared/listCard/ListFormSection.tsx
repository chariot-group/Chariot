import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ListFormSectionProps {
  title: string;
  className?: string;
  children: ReactNode;
}

/**
 * Titled group of fields inside an expanded list row (edit mode). Sections are separated by
 * a divider so the form reads as a hierarchy instead of a flat wall of fields.
 * @see FR-character-list-card
 */
export default function ListFormSection({ title, className, children }: ListFormSectionProps) {
  const titleId = useId();

  return (
    <section
      className={cn("flex min-w-0 flex-col gap-2 border-t border-border pt-3 first:border-t-0 first:pt-0", className)}
      aria-labelledby={titleId}>
      <h3
        id={titleId}
        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}
