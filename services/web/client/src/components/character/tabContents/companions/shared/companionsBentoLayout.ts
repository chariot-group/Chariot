/**
 * Bento slots of the Player sheet Companions tab.
 *
 * Same viewport grid as the History and Inventory tabs (2 / 4 / 12 columns, one gap):
 * - with companions: the liaison toolbar on its own full-width row, then one card per companion
 *   (full width below `xl`, half width — two per row — from `xl`);
 * - empty: an explanation card (8) and an examples card (4) on one band, 2 + 2 at `sm`.
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
  companion: `${FULL} xl:col-span-6`,
  emptyIntro: `${HALF} xl:col-span-8`,
  emptyExamples: `${HALF} xl:col-span-4`,
} as const;
