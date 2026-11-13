/**
 * Label/value cells of the character sheet: one style everywhere, never tinted boxes nested in a card.
 * Spacing and typography only — no delimiters between cells (decision 2026-11-13 amended).
 * @see FR-character-statistics-card
 */

/** Fact cell inside a sheet card. */
export const FACT_CELL_CLASS = "flex min-w-0 flex-col gap-0.5";

/** Optional wrapper when a fact grid needs `min-w-0` / `@container` nesting. */
export const FACT_CELLS_FRAME_CLASS = "min-w-0";
