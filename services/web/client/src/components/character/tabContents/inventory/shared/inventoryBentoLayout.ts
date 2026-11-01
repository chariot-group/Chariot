/**
 * Bento slots of the character Inventory tab (read and edit modes).
 *
 * Same grid as the General tab (2 / 4 / 12 columns, one gap). Coins are a full-width strip;
 * equipment and treasure (free texts) are paired side by side from `sm`.
 *
 * @see FR-character-inventory-bento-layout
 */
import {
  BENTO_FULL_SLOT as FULL,
  BENTO_HALF_SLOT as HALF,
} from "@/components/character/tabContents/general/shared/generalBentoLayout";

export { GENERAL_BENTO_GRID_CLASS as INVENTORY_BENTO_GRID_CLASS } from "@/components/character/tabContents/general/shared/generalBentoLayout";

export const INVENTORY_SLOTS = {
  coins: `${FULL} xl:col-span-12`,
  equipment: `${HALF} xl:col-span-6`,
  treasure: `${HALF} xl:col-span-6`,
} as const;
