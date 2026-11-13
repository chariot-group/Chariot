import { cn } from "@/lib/utils";

interface StableLabelProps {
  /** Label currently shown. */
  label: string;
  /** Other labels the slot can switch to; rendered invisible so the slot keeps the widest width. */
  alternates: string[];
  className?: string;
}

/**
 * Label slot whose width never changes when its text switches (e.g. « Copier le lien » → « Copié ! »),
 * so the surrounding button keeps the same size (FR-frontend-button-system, copy confirmation).
 * All labels share one grid cell; only the current one is visible and exposed to assistive tech.
 */
function StableLabel({ label, alternates, className }: StableLabelProps) {
  return (
    <span className={cn("grid min-w-0", className)}>
      <span className="col-start-1 row-start-1 truncate">{label}</span>
      {alternates
        .filter((alternate) => alternate !== label)
        .map((alternate) => (
          <span
            key={alternate}
            aria-hidden="true"
            data-stable-label-ghost=""
            className="invisible col-start-1 row-start-1 truncate">
            {alternate}
          </span>
        ))}
    </span>
  );
}

export { StableLabel };
