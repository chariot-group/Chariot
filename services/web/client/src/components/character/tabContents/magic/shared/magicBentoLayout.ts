import { BENTO_FULL_SLOT as FULL } from "@/components/character/tabContents/general/shared/generalBentoLayout";

/**
 * Bento slots of the Magic tab (read and edit): the class selector, a compact Spellcasting band,
 * then the Spells list, all full width.
 * @see FR-character-magic-list-card
 */
export const MAGIC_SLOTS = {
  selector: `${FULL} xl:col-span-12`,
  spellcasting: `${FULL} xl:col-span-12`,
  spells: `${FULL} xl:col-span-12`,
} as const;
