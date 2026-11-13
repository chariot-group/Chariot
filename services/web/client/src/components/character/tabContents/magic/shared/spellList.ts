import type { Spell } from "@/types/character";
import { getSpellLevelsFromSpells, npcUsesKey } from "@/utils/magic.utils";
import { formatDamageFormula, hydrateSpellDamageDetails } from "@/utils/spell-damage.utils";
import { isConcentrationSpell } from "@/components/initiativeTracker/concentration.utils";
import {
  BENTO_FULL_SLOT as FULL,
  BENTO_GRID_CLASS,
} from "@/components/character/tabContents/general/shared/generalBentoLayout";

export const MAGIC_BENTO_GRID_CLASS = BENTO_GRID_CLASS;

/**
 * Magic tab panel (`CharacterTabPanels`, direct child of the sheet scroll area, itself sized by the
 * layout flex chain: header / navbar, sheet header and footer already taken out). From `xl` it fills
 * the remaining height of that scroll area, never below a minimum: on a short screen the sheet
 * scrolls instead of crushing the Spells list. No viewport `calc()`.
 * @see FR-character-magic-list-card
 */
export const MAGIC_TAB_PANEL_CLASS = "xl:flex xl:flex-1 xl:flex-col xl:min-h-[28rem]";
/** Body of the Magic panel: passes the panel height down to the grid. */
export const MAGIC_TAB_BODY_CLASS = "flex min-h-0 flex-col xl:flex-1";

/**
 * Magic grid: from `xl` it takes the panel height; the selector (when shown) and Spellcasting rows
 * keep their content height, the Spells row takes the rest. Below `xl` the grid keeps its content
 * height (the Spells list keeps its shared cap).
 * @see FR-character-magic-list-card
 */
export function magicBentoGridClass(hasSelector: boolean) {
  const rows = hasSelector ? "xl:grid-rows-[auto_auto_minmax(0,1fr)]" : "xl:grid-rows-[auto_minmax(0,1fr)]";
  return `${BENTO_GRID_CLASS} xl:flex-1 xl:min-h-0 ${rows}`;
}

export { MAGIC_SLOTS } from "@/components/character/tabContents/magic/shared/magicBentoLayout";

/**
 * Wide read mode (`xl`, read only): Spellcasting and the Spells list stack in a 5-column left
 * column; the spell detail panel spans both rows on the right (placed explicitly, so DOM order —
 * list before panel — stays the tab order). The selector, when shown, stays full width above.
 * @see FR-character-magic-list-card
 */
export function magicWideSlots(hasSelector: boolean) {
  return {
    spellcasting: `${FULL} xl:col-span-5 xl:col-start-1`,
    spells: `${FULL} xl:col-span-5 xl:col-start-1`,
    detail: `${FULL} xl:col-span-7 xl:col-start-6 xl:row-span-2 xl:min-h-0 ${hasSelector ? "xl:row-start-2" : "xl:row-start-1"}`,
  };
}

/**
 * Spell shown in the wide read panel: the selected index when it is still a displayed spell,
 * else the first spell in display order (null when the block has no spell).
 * @see FR-character-magic-list-card
 */
export function resolveSelectedSpellIndex(groups: SpellGroup[], selected: number | null): number | null {
  const displayed = groups.flatMap((group) => group.indices);
  if (selected !== null && displayed.includes(selected)) return selected;
  return displayed[0] ?? null;
}

/** Accordion value of a spell row (stable across level changes: rows are keyed by spell index). */
export const spellRowValue = (index: number) => `spell-${index}`;

export interface SpellGroup {
  /** `level-N` or `uses-…` (npcUsesKey). */
  key: string;
  kind: "level" | "uses";
  /** Spell level, or uses per day (`null` = at will). */
  value: number | null;
  /** Indices in the spell list, in display order. */
  indices: number[];
}

interface BuildSpellGroupsOptions {
  /** Innate blocks group by uses per day instead of level. */
  isInnate: boolean;
  /**
   * Read mode sorts each group (prepared first for level ≥ 1 when `preparedFirst`, then by name).
   * Edit mode keeps the list order so a row never moves while its name is typed.
   */
  sort: boolean;
  preparedFirst?: boolean;
}

const byName = (spells: Spell[]) => (a: number, b: number) =>
  (spells[a]?.name || "").localeCompare(spells[b]?.name || "", undefined, { sensitivity: "base" });

/**
 * Spell groups of one spellcasting block, only for levels / uses that have spells.
 * @see FR-character-magic-list-card, FR-magic-spell-level-categories
 */
export function buildSpellGroups(spells: Spell[], { isInnate, sort, preparedFirst = false }: BuildSpellGroupsOptions) {
  const groups: SpellGroup[] = [];

  if (isInnate) {
    const uses = Array.from(new Set(spells.map((spell) => spell.usesPerDay ?? null))).sort((a, b) => {
      if (a === null) return -1;
      if (b === null) return 1;
      return a - b;
    });
    for (const value of uses) {
      const indices = spells.flatMap((spell, index) => ((spell.usesPerDay ?? null) === value ? [index] : []));
      if (sort) indices.sort(byName(spells));
      groups.push({ key: npcUsesKey(value), kind: "uses", value, indices });
    }
    return groups;
  }

  for (const level of getSpellLevelsFromSpells(spells)) {
    const indices = spells.flatMap((spell, index) => (Number(spell.level) === level ? [index] : []));
    if (sort) {
      const name = byName(spells);
      indices.sort((a, b) => {
        if (preparedFirst && level > 0) {
          const pa = spells[a]?.prepared === true ? 0 : 1;
          const pb = spells[b]?.prepared === true ? 0 : 1;
          if (pa !== pb) return pa - pb;
        }
        return name(a, b);
      });
    }
    groups.push({ key: `level-${level}`, kind: "level", value: level, indices });
  }
  return groups;
}

/** Damage dice joined with " + " (types left to the details), else the healing dice, else null. */
function spellEffectDice(spell: Spell): string | null {
  const damage = hydrateSpellDamageDetails(spell.damageDetails, spell.damage)
    .map((entry) => formatDamageFormula(entry.diceCount, entry.diceType, entry.bonus))
    .filter(Boolean)
    .join(" + ");
  if (damage) return damage;
  if (spell.healingDetails) {
    return (
      formatDamageFormula(spell.healingDetails.diceCount, spell.healingDetails.diceType, spell.healingDetails.bonus) ||
      null
    );
  }
  return spell.healing?.trim() || null;
}

/**
 * Collapsed-row summary pills: casting time · range · effect dice (empty parts dropped). School and
 * damage types stay in the details.
 * @see FR-character-magic-list-card
 */
export function spellSummaryParts(spell: Spell, convertRange: (range: string) => string): string[] {
  return [spell.castingTime, spell.range ? convertRange(spell.range) : "", spellEffectDice(spell) ?? ""]
    .map((part) => (part ?? "").trim())
    .filter(Boolean);
}

export const spellRequiresConcentration = (spell: Spell) => isConcentrationSpell(spell);
