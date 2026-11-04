/**
 * Bento grid of the character General tab (read and edit modes).
 *
 * Grid units: 2 columns below `sm`, 4 from `sm`, 12 from `xl`. From `3xl` (very large screens) the
 * grid keeps 12 columns with a wide placement: the first band is denser so cards do not stretch.
 * Every card is a direct child of the grid and gets one slot class below. Spans are
 * chosen so that each row is filled at every breakpoint (no empty cell), with the DOM
 * order as reading order (no `order-*`, no dense packing).
 *
 * @see FR-character-general-bento-layout
 */
export const GENERAL_BENTO_GRID_CLASS = "grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4 xl:grid-cols-12";

/** Spacing between cards stacked inside one slot (same token as the grid gap). */
export const GENERAL_BENTO_STACK_GAP_CLASS = "gap-3 md:gap-4";

/**
 * Bounded list (read mode only): caps an unbounded list and scrolls inside its card.
 * Pair it with `role="group"`, `aria-labelledby` (card heading) and `tabIndex={0}`.
 * @see FR-character-general-bento-layout, FR-character-battle-bento-layout
 */
export const BENTO_BOUNDED_LIST_CLASS =
  "max-h-[28rem] overflow-y-auto pr-2 rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-scrollbar-thumb-hover";

/** Full width below `xl` (2 cols on mobile, 4 on tablet). */
export const BENTO_FULL_SLOT = "min-w-0 col-span-2 sm:col-span-4";
/** Full width on mobile, half width on tablet. */
export const BENTO_HALF_SLOT = "min-w-0 col-span-2";

const FULL = BENTO_FULL_SLOT;
const HALF = BENTO_HALF_SLOT;

export const PLAYER_VIEW_SLOTS = {
  character: `${FULL} xl:col-span-4 xl:row-span-2 3xl:col-span-3`,
  statistics: `${FULL} xl:col-span-8 3xl:col-span-5 3xl:row-span-2`,
  /** Proficiency bonus, passive perception, inspiration, exhaustion (one row next to the statistics from `3xl`). */
  tile: "min-w-0 col-span-1 xl:col-span-2 3xl:col-span-1",
  /**
   * Tall and leftmost (same as NPC): spans the Ability scores + Saving throws rows from `sm`;
   * wide enough from `xl` for a 3-column list (container queries).
   */
  skills: `${HALF} sm:row-span-2 xl:col-span-8`,
  abilityScores: `${HALF} xl:col-span-4`,
  /** Right under the ability scores. */
  savingThrows: `${HALF} xl:col-span-4`,
  /**
   * Full width: its sections flow in columns (container queries). From `3xl` it moves up under the
   * tiles, next to the statistics (explicit placement, DOM order unchanged).
   */
  proficiencies: `${FULL} xl:col-span-12 3xl:col-span-4 3xl:col-start-9 3xl:row-start-2`,
  abilities: `${FULL} xl:col-span-12`,
} as const;

/** Edit tiles hold form controls and the Proficiencies form is long: 2 × 2 tiles from `3xl`, Proficiencies full width. */
export const PLAYER_EDIT_SLOTS = {
  ...PLAYER_VIEW_SLOTS,
  character: `${FULL} xl:col-span-4 xl:row-span-3 3xl:col-span-3 3xl:row-span-2`,
  tile: `${HALF} xl:col-span-4 3xl:col-span-2`,
  proficiencies: `${FULL} xl:col-span-12`,
} as const;

/**
 * NPC (GM constraint): tall Skills card as far left as possible (wide enough for a 3-column list),
 * Ability scores then Saving throws stacked just to its right. Same placement from `xl` to `3xl`.
 */
export const NPC_VIEW_SLOTS = {
  /** No row span: a sparse NPC identity must not be stretched next to the statistics. */
  character: `${FULL} xl:col-span-4`,
  statistics: `${FULL} xl:col-span-8`,
  /** Tall: spans the Ability scores + Saving throws rows from `sm`. */
  skills: `${HALF} sm:row-span-2 xl:col-span-8`,
  abilityScores: `${HALF} xl:col-span-4`,
  /** Right under the ability scores. */
  savingThrows: `${HALF} xl:col-span-4`,
  /** Full width: its sections flow in columns (container queries). */
  proficiencies: `${FULL} xl:col-span-12`,
  abilities: `${FULL} xl:col-span-12`,
} as const;

export const NPC_EDIT_SLOTS = NPC_VIEW_SLOTS;
