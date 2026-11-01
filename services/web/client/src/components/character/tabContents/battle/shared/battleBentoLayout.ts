/**
 * Bento slots of the character Combat tab (read and edit modes).
 *
 * Same grid as the General tab (2 / 4 / 12 columns, one gap). List cards (action sections,
 * abilities) are paired side by side from `xl` and never sit next to a fixed-size card.
 *
 * @see FR-character-battle-bento-layout
 */
import {
  BENTO_FULL_SLOT as FULL,
  BENTO_HALF_SLOT as HALF,
} from "@/components/character/tabContents/general/shared/generalBentoLayout";

export {
  GENERAL_BENTO_GRID_CLASS as BATTLE_BENTO_GRID_CLASS,
  GENERAL_BENTO_STACK_GAP_CLASS as BATTLE_BENTO_STACK_GAP_CLASS,
} from "@/components/character/tabContents/general/shared/generalBentoLayout";

export const PLAYER_BATTLE_SLOTS = {
  statistics: `${FULL} xl:col-span-5 xl:row-span-2`,
  savingThrows: `${HALF} xl:col-span-4`,
  deathSaves: `${HALF} xl:col-span-3`,
  affinities: `${FULL} xl:col-span-7`,
  /** List cards: full width below `xl`, paired 6 + 6 from `xl`. */
  actions: `${FULL} xl:col-span-6`,
  abilities: `${FULL} xl:col-span-6`,
} as const;

export const NPC_BATTLE_SLOTS = {
  statistics: `${FULL} xl:col-span-5 xl:row-span-2`,
  savingThrows: `${HALF} xl:col-span-7`,
  affinities: `${HALF} xl:col-span-7`,
  /** Standard, legendary and lair actions, then abilities: paired 6 + 6 from `xl`. */
  actions: `${FULL} xl:col-span-6`,
  abilities: `${FULL} xl:col-span-6`,
} as const;
