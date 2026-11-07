/**
 * Bento grid of the character General tab (read and edit modes).
 *
 * The grid follows the width available to the sheet, not the viewport: an open sidebar leaves less
 * room, so the grid columns are driven by container queries on `GENERAL_BENTO_CONTAINER_CLASS`
 * (sizes defined in `globals.css`): 2 columns below `@sheet-md` (36rem), 4 from `@sheet-md`,
 * 12 from `@sheet-lg` (56rem). From `@sheet-xl` (96rem, very large screens) the grid keeps 12 columns
 * with a wide placement: the first band is denser so cards do not stretch.
 * Every card is a direct child of the grid and gets one slot class below. Spans are
 * chosen so that each row is filled at every width (no empty cell), with the DOM
 * order as reading order (no `order-*`, no dense packing).
 *
 * @see FR-character-general-bento-layout
 */

/** Query container wrapping the General grid (its width drives the grid columns). */
export const GENERAL_BENTO_CONTAINER_CLASS = "@container w-full min-w-0";

export const GENERAL_BENTO_GRID_CLASS =
  "grid w-full min-w-0 grid-cols-2 gap-3 @sheet-md:grid-cols-4 md:gap-4 @sheet-lg:grid-cols-12";

/**
 * Viewport-based bento grid shared by the other sheet tabs (Combat, Magic, Inventory, History),
 * paired with `BENTO_FULL_SLOT` / `BENTO_HALF_SLOT`.
 * @see FR-character-battle-bento-layout
 */
export const BENTO_GRID_CLASS = "grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4 xl:grid-cols-12";

/** Spacing between cards stacked inside one slot (same token as the grid gap). */
export const GENERAL_BENTO_STACK_GAP_CLASS = "gap-3 md:gap-4";

/**
 * Bounded list (read mode only): caps an unbounded list and scrolls inside its card.
 * Pair it with `role="group"`, `aria-labelledby` (card heading) and `tabIndex={0}`.
 * @see FR-character-general-bento-layout, FR-character-battle-bento-layout
 */
export const BENTO_BOUNDED_LIST_CLASS =
  "max-h-[28rem] overflow-y-auto pr-2 rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-scrollbar-thumb-hover";

/**
 * Rows height of the Abilities list of the General tab (read and edit modes), merged over the shared caps.
 * Below `@sheet-md` it is capped at `20rem` so a long list does not push the next cards down; from `@sheet-md`
 * the slot (`ABILITIES_STRETCHED_ROWS_CLASS`) makes it fill its stretched card instead.
 * @see FR-character-general-bento-layout
 */
export const GENERAL_ABILITIES_LIST_MAX_HEIGHT_CLASS =
  "basis-auto h-[var(--abilities-rows-h,auto)] max-h-[var(--abilities-rows-max,20rem)] min-h-[var(--abilities-rows-min,0px)]";

/** Viewport grid (`BENTO_GRID_CLASS`): full width below `xl` (2 cols on mobile, 4 on tablet). */
export const BENTO_FULL_SLOT = "min-w-0 col-span-2 sm:col-span-4";
/** Full width on mobile, half width on tablet (viewport and General grids). */
export const BENTO_HALF_SLOT = "min-w-0 col-span-2";

/** General grid: full width below `@sheet-lg` (2 cols on mobile, 4 on tablet). */
const FULL = "min-w-0 col-span-2 @sheet-md:col-span-4";
const HALF = BENTO_HALF_SLOT;

/**
 * From `@sheet-md` the Abilities card sits beside the Skills card and is stretched by the grid: it sets the
 * rows-area variables read by `GENERAL_ABILITIES_LIST_MAX_HEIGHT_CLASS`, so the rows drop the `20rem` cap and
 * fill the card (`height: 0` + `flex-basis: auto`, `20rem` floor) while the card height stays driven by its
 * neighbours — a `0%` basis would fall back to the content height while the grid sizes its rows. Variables,
 * not a `@sheet-md:[&>…]` class: a container query on the rows area would resolve against the card itself.
 * @see FR-character-list-card
 */
const ABILITIES_STRETCHED_ROWS_CLASS =
  "@sheet-md:[--abilities-rows-h:0px] @sheet-md:[--abilities-rows-max:none] @sheet-md:[--abilities-rows-min:20rem]";

/**
 * Skills band (PC and NPC, DOM order Skills · Ability scores · Saving throws · Abilities · Proficiencies).
 * - `@sheet-lg`: Skills (6 cols, 2 rows) · Ability scores and Saving throws side by side (3 + 3), Abilities
 *   under both (6 cols, 2 rows) · Proficiencies under the skills (6 cols).
 * - `@sheet-xl`: Skills (6, 2 rows) · Ability scores over Saving throws (3) · Abilities (3, 2 rows), placed
 *   explicitly on the band rows (`row-start` given per layout, as the first band height differs; literal
 *   classes so Tailwind generates them).
 */
const skillsBand = (bandRowStart: "@sheet-xl:row-start-2" | "@sheet-xl:row-start-3" | "@sheet-xl:row-start-5") =>
  ({
    skills: `${HALF} @sheet-md:row-span-3 @sheet-lg:row-span-2 @sheet-lg:col-span-6`,
    abilityScores: `${HALF} @sheet-lg:col-span-3`,
    savingThrows: `${HALF} @sheet-lg:col-span-3`,
    abilities: `${HALF} @sheet-lg:col-span-6 @sheet-lg:row-span-2 @sheet-xl:col-span-3 @sheet-xl:col-start-10 ${bandRowStart} ${ABILITIES_STRETCHED_ROWS_CLASS}`,
  }) as const;

export const PLAYER_VIEW_SLOTS = {
  character: `${FULL} @sheet-lg:col-span-4 @sheet-lg:row-span-2 @sheet-xl:col-span-3`,
  statistics: `${FULL} @sheet-lg:col-span-8 @sheet-xl:col-span-5 @sheet-xl:row-span-2`,
  /** Proficiency bonus, passive perception, inspiration, exhaustion (one row next to the statistics from `@sheet-xl`). */
  tile: "min-w-0 col-span-1 @sheet-lg:col-span-2 @sheet-xl:col-span-1",
  /** The first band takes 2 rows from `@sheet-xl`, so the skills band starts on row 3. */
  ...skillsBand("@sheet-xl:row-start-3"),
  /**
   * Under the skills from `@sheet-lg` (sections in columns, container queries). From `@sheet-xl`
   * it moves up under the tiles, next to the statistics (explicit placement, DOM order unchanged).
   */
  proficiencies: `${FULL} @sheet-lg:col-span-6 @sheet-xl:col-span-4 @sheet-xl:col-start-9 @sheet-xl:row-start-2`,
} as const;

/**
 * Edit tiles hold form controls and the Proficiencies form is long: from `@sheet-xl` the tiles stay
 * 2 × 2 and Proficiencies stays full width (not moved up next to the statistics).
 */
export const PLAYER_EDIT_SLOTS = {
  ...PLAYER_VIEW_SLOTS,
  character: `${FULL} @sheet-lg:col-span-4 @sheet-lg:row-span-3 @sheet-xl:col-span-5 @sheet-xl:row-span-4`,
  statistics: `${FULL} @sheet-lg:col-span-8 @sheet-xl:col-span-5 @sheet-xl:row-span-4`,
  /** From `@sheet-xl` the 4 tiles stack in one 2-column column; the freed width goes to the Character card. */
  tile: `${HALF} @sheet-lg:col-span-4 @sheet-xl:col-span-2`,
  ...skillsBand("@sheet-xl:row-start-5"),
  /** Proficiencies stays at the bottom: under the skills at `@sheet-lg`, full width from `@sheet-xl`. */
  proficiencies: `${FULL} @sheet-lg:col-span-6 @sheet-xl:col-span-12`,
} as const;

/**
 * Row tracks of the PC edit first band. The Character card spans 3 (4) rows: with `auto` tracks its height
 * would be spread over every row and stretch the tiles. Only one flexible track (`1fr`) absorbs it:
 * the Statistics row at `@sheet-lg`, the last tile row at `@sheet-xl`.
 * @see FR-character-general-bento-layout
 */
export const PLAYER_EDIT_GRID_ROWS_CLASS =
  "@sheet-lg:grid-rows-[1fr_auto_auto] @sheet-xl:grid-rows-[auto_auto_auto_1fr]";

/**
 * NPC (GM constraint): tall Skills card as far left as possible, same skills band as the PC.
 */
export const NPC_VIEW_SLOTS = {
  /** No row span: a sparse NPC identity must not be stretched next to the statistics. */
  character: `${FULL} @sheet-lg:col-span-4`,
  statistics: `${FULL} @sheet-lg:col-span-8`,
  /** The first band is a single row, so the skills band starts on row 2. */
  ...skillsBand("@sheet-xl:row-start-2"),
  /** Under the skills from `@sheet-lg`, full width from `@sheet-xl` (sections in columns). */
  proficiencies: `${FULL} @sheet-lg:col-span-6 @sheet-xl:col-span-12`,
} as const;

export const NPC_EDIT_SLOTS = NPC_VIEW_SLOTS;
