/**
 * Bento grid of the character General tab (read and edit modes).
 *
 * Grid units: 2 columns below `sm`, 4 from `sm`, 12 from `xl`.
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
  character: `${FULL} xl:col-span-4 xl:row-span-2`,
  statistics: `${FULL} xl:col-span-8`,
  /** Proficiency bonus, passive perception, inspiration, exhaustion. */
  tile: "min-w-0 col-span-1 xl:col-span-2",
  abilityScores: `${HALF} xl:col-span-4 xl:row-span-2`,
  savingThrows: `${HALF} xl:col-span-4 xl:row-span-2`,
  /** Alignment, background (side by side below `xl`, stacked next to the saving throws from `xl`). */
  sideTile: "min-w-0 col-span-1 sm:col-span-2 xl:col-span-4",
  /** Wide card: its list flows on several columns (container queries). */
  skills: `${FULL} xl:col-span-8`,
  proficiencies: `${FULL} xl:col-span-4`,
  abilities: `${FULL} xl:col-span-12`,
} as const;

export const PLAYER_EDIT_SLOTS = {
  ...PLAYER_VIEW_SLOTS,
  character: `${FULL} xl:col-span-4 xl:row-span-3`,
  tile: `${HALF} xl:col-span-4`,
  sideTile: `${HALF} xl:col-span-4`,
} as const;

export const NPC_VIEW_SLOTS = {
  /** No row span: a sparse NPC identity must not be stretched next to the statistics. */
  character: `${FULL} xl:col-span-4`,
  statistics: `${FULL} xl:col-span-8`,
  abilityScores: `${HALF} xl:col-span-4`,
  savingThrows: `${HALF} xl:col-span-4`,
  proficiencies: `${FULL} xl:col-span-4`,
  skills: `${FULL} xl:col-span-8 xl:row-span-2`,
  /** Passive perception, alignment (stacked next to the skills from `xl`). */
  tile: "min-w-0 col-span-1 sm:col-span-2 xl:col-span-4",
  abilities: `${FULL} xl:col-span-12`,
} as const;

export const NPC_EDIT_SLOTS = {
  ...NPC_VIEW_SLOTS,
  tile: `${HALF} xl:col-span-4`,
} as const;
