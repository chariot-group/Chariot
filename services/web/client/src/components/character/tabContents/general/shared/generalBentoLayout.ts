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
 * Lower cap for the Abilities list of the General tab (read and edit modes): the card sits right under
 * the statistics, so a long list must not push the skills band down, and the sheet does not grow on edit.
 * Merged over the shared read / edit caps.
 * @see FR-character-general-bento-layout
 */
export const GENERAL_ABILITIES_LIST_MAX_HEIGHT_CLASS = "max-h-[20rem]";

/** Viewport grid (`BENTO_GRID_CLASS`): full width below `xl` (2 cols on mobile, 4 on tablet). */
export const BENTO_FULL_SLOT = "min-w-0 col-span-2 sm:col-span-4";
/** Full width on mobile, half width on tablet (viewport and General grids). */
export const BENTO_HALF_SLOT = "min-w-0 col-span-2";

/** General grid: full width below `@sheet-lg` (2 cols on mobile, 4 on tablet). */
const FULL = "min-w-0 col-span-2 @sheet-md:col-span-4";
const HALF = BENTO_HALF_SLOT;

export const PLAYER_VIEW_SLOTS = {
  character: `${FULL} @sheet-lg:col-span-4 @sheet-lg:row-span-2 @sheet-xl:col-span-3`,
  statistics: `${FULL} @sheet-lg:col-span-8 @sheet-xl:col-span-5 @sheet-xl:row-span-2`,
  /** Proficiency bonus, passive perception, inspiration, exhaustion (one row next to the statistics from `@sheet-xl`). */
  tile: "min-w-0 col-span-1 @sheet-lg:col-span-2 @sheet-xl:col-span-1",
  /**
   * Tall and leftmost (same as NPC): on tablet it spans the Ability scores + Saving throws + Proficiencies
   * rows, from `@sheet-lg` the Ability scores + Saving throws rows; wide enough from `@sheet-lg` for a
   * 3-column list (container queries).
   */
  skills: `${HALF} @sheet-md:row-span-3 @sheet-lg:row-span-2 @sheet-lg:col-span-8`,
  abilityScores: `${HALF} @sheet-lg:col-span-4`,
  /** Right under the ability scores. */
  savingThrows: `${HALF} @sheet-lg:col-span-4`,
  /**
   * Half width on tablet, under the saving throws. Full width from `@sheet-lg`: its sections flow in
   * columns (container queries). From `@sheet-xl` it moves up under the tiles, next to the statistics
   * (explicit placement, DOM order unchanged).
   */
  proficiencies: `${HALF} @sheet-lg:col-span-12 @sheet-xl:col-span-4 @sheet-xl:col-start-9 @sheet-xl:row-start-2`,
  abilities: `${FULL} @sheet-lg:col-span-12`,
} as const;

/**
 * Edit tiles hold form controls and the Proficiencies form is long: from `@sheet-xl` the tiles stay
 * 2 × 2 and Proficiencies stays full width (not moved up next to the statistics).
 */
export const PLAYER_EDIT_SLOTS = {
  ...PLAYER_VIEW_SLOTS,
  character: `${FULL} @sheet-lg:col-span-4 @sheet-lg:row-span-3 @sheet-xl:col-span-3 @sheet-xl:row-span-2`,
  tile: `${HALF} @sheet-lg:col-span-4 @sheet-xl:col-span-2`,
  proficiencies: `${HALF} @sheet-lg:col-span-12`,
} as const;

/**
 * NPC (GM constraint): tall Skills card as far left as possible (wide enough for a 3-column list),
 * Ability scores then Saving throws stacked just to its right (then Proficiencies on tablet).
 * Same placement from `@sheet-lg` to `@sheet-xl`.
 */
export const NPC_VIEW_SLOTS = {
  /** No row span: a sparse NPC identity must not be stretched next to the statistics. */
  character: `${FULL} @sheet-lg:col-span-4`,
  statistics: `${FULL} @sheet-lg:col-span-8`,
  /** Tall: on tablet spans the Ability scores + Saving throws + Proficiencies rows, from `@sheet-lg` the first two. */
  skills: `${HALF} @sheet-md:row-span-3 @sheet-lg:row-span-2 @sheet-lg:col-span-8`,
  abilityScores: `${HALF} @sheet-lg:col-span-4`,
  /** Right under the ability scores. */
  savingThrows: `${HALF} @sheet-lg:col-span-4`,
  /** Half width on tablet, under the saving throws; full width from `@sheet-lg` (sections in columns). */
  proficiencies: `${HALF} @sheet-lg:col-span-12`,
  abilities: `${FULL} @sheet-lg:col-span-12`,
} as const;

export const NPC_EDIT_SLOTS = NPC_VIEW_SLOTS;
