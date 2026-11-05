/**
 * Bento slots of the character Inventory tab (read and edit modes).
 *
 * Same grid as the General tab (2 / 4 / 12 columns, one gap). From `sm`, two equal columns:
 * coins then equipment on the left, treasure on the right spanning both rows (explicit start,
 * DOM order unchanged). Every card is full width on mobile.
 *
 * @see FR-character-inventory-bento-layout
 */
import {
  BENTO_GRID_CLASS,
  BENTO_HALF_SLOT as HALF,
} from "@/components/character/tabContents/general/shared/generalBentoLayout";

/**
 * Shared bento grid, plus `auto 1fr` rows from `sm`: the coins row keeps its content height and only
 * the equipment row absorbs the extra height when the treasure card (spanning both rows) grows.
 */
export const INVENTORY_BENTO_GRID_CLASS = `${BENTO_GRID_CLASS} sm:grid-rows-[auto_1fr]`;

export const INVENTORY_SLOTS = {
  coins: `${HALF} xl:col-span-6`,
  equipment: `${HALF} xl:col-span-6`,
  treasure: `${HALF} sm:col-start-3 sm:row-start-1 sm:row-span-2 xl:col-span-6 xl:col-start-7`,
} as const;
