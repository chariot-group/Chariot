/**
 * Test helper: simulates CSS Grid sparse row auto-placement of bento slot classes.
 * @see FR-character-general-bento-layout, FR-character-battle-bento-layout
 */
export type Breakpoint = { prefixes: string[]; columns: number };

export const BREAKPOINTS: Record<string, Breakpoint> = {
  mobile: { prefixes: [""], columns: 2 },
  tablet: { prefixes: ["", "sm:"], columns: 4 },
  desktop: { prefixes: ["", "sm:", "xl:"], columns: 12 },
  /** Very large screens (`3xl`): same 12 columns, wide placement. */
  wide: { prefixes: ["", "sm:", "xl:", "3xl:"], columns: 12 },
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

/** Sparse row auto-placement (CSS Grid default); returns the occupancy matrix. */
export const place = (slots: string[], bp: Breakpoint) => {
  const grid: boolean[][] = [];
  const free = (r: number, c: number, w: number, h: number) => {
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (grid[y]?.[x]) return false;
    return true;
  };
  let cursorRow = 0;
  let cursorCol = 0;
  for (const classes of slots) {
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
    for (let y = r; y < r + h; y++) {
      grid[y] ??= Array(bp.columns).fill(false);
      for (let x = c; x < c + w; x++) grid[y][x] = true;
    }
    cursorRow = r;
    cursorCol = c + w;
  }
  return grid.map((row) => row ?? Array(bp.columns).fill(false));
};

export const emptyCells = (slots: string[], bp: Breakpoint) =>
  place(slots, bp).flatMap((row, r) => row.map((filled, c) => (filled ? null : `${r}:${c}`)).filter(Boolean));
