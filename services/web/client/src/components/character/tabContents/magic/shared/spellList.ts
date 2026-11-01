import type { Spell } from "@/types/character";
import { getSpellLevelsFromSpells, npcUsesKey } from "@/utils/magic.utils";
import { formatDamageFormula, formatSpellDamageList } from "@/utils/spell-damage.utils";
import { isConcentrationSpell } from "@/components/initiativeTracker/concentration.utils";
import { BENTO_FULL_SLOT as FULL } from "@/components/character/tabContents/general/shared/generalBentoLayout";

export { GENERAL_BENTO_GRID_CLASS as MAGIC_BENTO_GRID_CLASS } from "@/components/character/tabContents/general/shared/generalBentoLayout";

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

/** Damage entries joined with " + ", else the healing formula, else null. */
function spellEffectFormula(spell: Spell): string | null {
  const damage = formatSpellDamageList(spell.damageDetails, spell.damage);
  if (damage) return damage;
  if (spell.healingDetails) {
    return (
      formatDamageFormula(spell.healingDetails.diceCount, spell.healingDetails.diceType, spell.healingDetails.bonus) ||
      null
    );
  }
  return spell.healing || null;
}

/**
 * Collapsed-row summary: school · casting time · range · effect (empty parts dropped).
 * @see FR-character-magic-list-card
 */
export function spellSummaryParts(spell: Spell, convertRange: (range: string) => string): string[] {
  return [
    spell.school,
    spell.castingTime,
    spell.range ? convertRange(spell.range) : "",
    spellEffectFormula(spell) ?? "",
  ]
    .map((part) => (part ?? "").trim())
    .filter(Boolean);
}

export const spellRequiresConcentration = (spell: Spell) => isConcentrationSpell(spell);
