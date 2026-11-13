/**
 * Bento slots of the Player sheet Companions tab.
 *
 * Same viewport grid as the History and Inventory tabs (2 / 4 / 12 columns, one gap):
 * - with companions: the liaison toolbar on its own full-width row, then one card per companion
 *   (full width below `lg` — mobile and tablet unchanged, one per row — `lg:col-span-2` for two
 *   per row on laptop, `xl:col-span-4` for three per row from `xl`, so cards stop growing past
 *   tablet width on larger screens);
 * - empty: an explanation card (8) and an examples card (4) on one band, full width each below
 *   `lg` (stacked — two side by side were too cramped on tablet / narrow laptop), 2 + 2 at `lg`,
 *   8 + 4 at `xl`.
 *
 * @see FR-npc-player-link
 */
import {
  BENTO_FULL_SLOT as FULL,
  BENTO_HALF_SLOT as HALF,
} from "@/components/character/tabContents/general/shared/generalBentoLayout";

export { BENTO_GRID_CLASS as COMPANIONS_BENTO_GRID_CLASS } from "@/components/character/tabContents/general/shared/generalBentoLayout";

export const COMPANIONS_SLOTS = {
  toolbar: `${FULL} xl:col-span-12`,
  companion: `${FULL} lg:col-span-2 xl:col-span-4`,
  noResults: `${FULL} xl:col-span-12`,
  emptyIntro: `${HALF} sm:col-span-4 lg:col-span-2 xl:col-span-8`,
  emptyExamples: `${HALF} sm:col-span-4 lg:col-span-2 xl:col-span-4`,
} as const;
