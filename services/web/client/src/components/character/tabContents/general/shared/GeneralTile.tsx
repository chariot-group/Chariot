import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GeneralTileProps {
  headingId: string;
  title: ReactNode;
  accentColor: string;
  className?: string;
  children: ReactNode;
}

/**
 * Compact bento tile (read mode): label on top, value pushed to the bottom so stretched
 * tiles of one row stay aligned.
 * @see FR-character-general-bento-layout
 */
export default function GeneralTile({ headingId, title, accentColor, className, children }: GeneralTileProps) {
  return (
    <Card
      className={cn("min-w-0 justify-between gap-2 p-4 md:px-6", className)}
      role="region"
      aria-labelledby={headingId}>
      <h2
        id={headingId}
        className={cn("text-base sm:text-lg font-semibold leading-tight wrap-break-word", accentColor)}>
        {title}
      </h2>
      <div className="min-w-0 wrap-break-word">{children}</div>
    </Card>
  );
}
