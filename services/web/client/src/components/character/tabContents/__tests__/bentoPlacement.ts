/**
 * Test helper: simulates CSS Grid sparse row auto-placement of bento slot classes.
 * @see FR-character-general-bento-layout, FR-character-battle-bento-layout
 */
export type Breakpoint = { prefixes: string[]; columns: number };

export const BREAKPOINTS: Record<string, Breakpoint> = {
  mobile: { prefixes: [""], columns: 2 },
  tablet: { prefixes: ["", "sm:"], columns: 4 },
  /** Laptop (`lg`, before `xl` kicks in): still the 4-column grid. */
  laptop: { prefixes: ["", "sm:", "lg:"], columns: 4 },
  desktop: { prefixes: ["", "sm:", "lg:", "xl:"], columns: 12 },
  /** Very large screens (`3xl`): same 12 columns, wide placement. */
  wide: { prefixes: ["", "sm:", "lg:", "xl:", "3xl:"], columns: 12 },
};

/**
 * General tab: widths available to the sheet (container queries, sidebar included),
 * same ranges as `BREAKPOINTS`. @see FR-character-general-bento-layout
 */
export const SHEET_BREAKPOINTS: Record<keyof typeof BREAKPOINTS, Breakpoint> = {
  mobile: { prefixes: [""], columns: 2 },
  tablet: { prefixes: ["", "@sheet-md:"], columns: 4 },
  desktop: { prefixes: ["", "@sheet-md:", "@sheet-lg:"], columns: 12 },
  /** Very large width (`@sheet-xl`): same 12 columns, wide placement. */
  wide: { prefixes: ["", "@sheet-md:", "@sheet-lg:", "@sheet-xl:"], columns: 12 },
};

/** Effective `col-span` / `row-span` at a breakpoint (mobile-first: the last matching prefix wins). */
export const spanAt = (classes: string, kind: "col" | "row", bp: Breakpoint) => {
  let span = 1;
  for (const prefix of bp.prefixes) {
    const match = classes.split(/\s+/).find((c) => new RegExp(`^${prefix}${kind}-span-(\\d+)$`).test(c));
    if (match) span = Number(match.split("-").pop());
  }
  return span;
};

/** Explicit `col-start` / `row-start` line at a breakpoint (1-based), or `undefined` (auto). */
export const startAt = (classes: string, kind: "col" | "row", bp: Breakpoint) => {
  let start: number | undefined;
  for (const prefix of bp.prefixes) {
    const match = classes.split(/\s+/).find((c) => new RegExp(`^${prefix}${kind}-start-(\\d+)$`).test(c));
    if (match) start = Number(match.split("-").pop());
  }
  return start;
};

/**
 * Sparse row auto-placement (CSS Grid default); returns the occupancy matrix.
 * Slots with both an explicit column and row start are placed first, like CSS Grid.
 */
export const place = (slots: string[], bp: Breakpoint) => {
  const grid: boolean[][] = [];
  const free = (r: number, c: number, w: number, h: number) => {
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (grid[y]?.[x]) return false;
    return true;
  };
  const fill = (r: number, c: number, w: number, h: number) => {
    for (let y = 0; y < r + h; y++) grid[y] ??= Array(bp.columns).fill(false);
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) grid[y][x] = true;
  };
  const isFixed = (classes: string) =>
    startAt(classes, "col", bp) !== undefined && startAt(classes, "row", bp) !== undefined;
  for (const classes of slots.filter(isFixed)) {
    const w = Math.min(spanAt(classes, "col", bp), bp.columns);
    fill(startAt(classes, "row", bp)! - 1, startAt(classes, "col", bp)! - 1, w, spanAt(classes, "row", bp));
  }
  let cursorRow = 0;
  let cursorCol = 0;
  for (const classes of slots.filter((c) => !isFixed(c))) {
    const w = Math.min(spanAt(classes, "col", bp), bp.columns);
    const h = spanAt(classes, "row", bp);
    let r = cursorRow;
    let c = cursorCol;
    while (c + w > bp.columns || !free(r, c, w, h)) {
      c++;
      if (c + w > bp.columns) {
        c = 0;
        r++;
      }
    }
    fill(r, c, w, h);
    cursorRow = r;
    cursorCol = c + w;
  }
  return grid.map((row) => row ?? Array(bp.columns).fill(false));
};

export const emptyCells = (slots: string[], bp: Breakpoint) =>
  place(slots, bp).flatMap((row, r) => row.map((filled, c) => (filled ? null : `${r}:${c}`)).filter(Boolean));
