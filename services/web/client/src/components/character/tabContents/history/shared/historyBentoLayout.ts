/**
 * Bento slots of the character History tab (read and edit modes).
 *
 * Same grid as the General tab (2 / 4 / 12 columns, one gap). Appearance and Description
 * share the first band, the four personality cards the second, Allies and Backstory the last.
 *
 * @see FR-character-history-bento-layout
 */
import {
  BENTO_FULL_SLOT as FULL,
  BENTO_HALF_SLOT as HALF,
} from "@/components/character/tabContents/general/shared/generalBentoLayout";

export { GENERAL_BENTO_GRID_CLASS as HISTORY_BENTO_GRID_CLASS } from "@/components/character/tabContents/general/shared/generalBentoLayout";

export const HISTORY_SLOTS = {
  appearance: `${HALF} xl:col-span-5`,
  description: `${HALF} xl:col-span-7`,
  /** Personality traits, ideals, bonds, flaws: two by two from `sm`, four in a row from `xl`. */
  personality: `${HALF} xl:col-span-3`,
  alliesAndOrgs: `${FULL} xl:col-span-4`,
  backstory: `${FULL} xl:col-span-8`,
} as const;

/** Free-text cards in DOM order, with their form field and slot. */
export const HISTORY_TEXT_FIELDS = [
  {
    key: "description",
    name: "appearance.description",
    inputId: "appearance-description",
    slot: HISTORY_SLOTS.description,
  },
  {
    key: "personalityTraits",
    name: "background.personalityTraits",
    inputId: "background-personalityTraits",
    slot: HISTORY_SLOTS.personality,
  },
  { key: "ideals", name: "background.ideals", inputId: "background-ideals", slot: HISTORY_SLOTS.personality },
  { key: "bonds", name: "background.bonds", inputId: "background-bonds", slot: HISTORY_SLOTS.personality },
  { key: "flaws", name: "background.flaws", inputId: "background-flaws", slot: HISTORY_SLOTS.personality },
  {
    key: "alliesAndOrgs",
    name: "background.alliesAndOrgs",
    inputId: "background-alliesAndOrgs",
    slot: HISTORY_SLOTS.alliesAndOrgs,
  },
  { key: "backstory", name: "background.backstory", inputId: "background-backstory", slot: HISTORY_SLOTS.backstory },
] as const;

export const historyHeadingId = (key: string) => `history-${key}-heading`;
