import { SPELL_CLASSES, type SpellClass } from "@/constants/spellClasses";
import type { SpellChoice } from "@/lib/rulesetEngine/types";
import type { Spell } from "@/types/character";

/**
 * Spells chosen in a `spellSelect` field of the builder (Codex or manual entry).
 * @see FR-ruleset-character-builder — Web builder UI (Spells, lot B)
 */

export type SpellFilterRange = { className?: unknown; minLevel?: unknown; maxLevel?: unknown };

const spellIdentity = (spell: { name?: unknown; level?: unknown }) =>
  `${String(spell.name ?? "")
    .trim()
    .toLowerCase()}|${Number(spell.level)}`;

/**
 * Builder answer from a Magic tab spell: the spell fields are kept, chosen spells of level 1+ are prepared.
 * `null` without a name.
 */
export function toSpellChoice(
  spell: Partial<Spell>,
  source: SpellChoice["source"],
  fallbackLevel = 0,
): SpellChoice | null {
  const name = spell.name?.trim();
  if (!name) return null;
  const level = typeof spell.level === "number" && Number.isFinite(spell.level) ? spell.level : fallbackLevel;
  return { ...spell, source, name, level, ...(level >= 1 ? { prepared: true } : {}) };
}

/** Adds spells, each name + level once (the first one is kept). */
export function addSpellChoices(current: readonly SpellChoice[], additions: readonly SpellChoice[]): SpellChoice[] {
  const next = [...current];
  for (const spell of additions) {
    if (!next.some((existing) => spellIdentity(existing) === spellIdentity(spell))) next.push(spell);
  }
  return next;
}

export function replaceSpellChoice(current: readonly SpellChoice[], index: number, spell: SpellChoice): SpellChoice[] {
  const others = current.filter((_, i) => i !== index);
  if (others.some((existing) => spellIdentity(existing) === spellIdentity(spell))) return [...current];
  return current.map((existing, i) => (i === index ? spell : existing));
}

export function removeSpellChoice(current: readonly SpellChoice[], index: number): SpellChoice[] {
  return current.filter((_, i) => i !== index);
}

/** Spell answers of a field, malformed items left out. */
export function readSpellChoices(answer: unknown): SpellChoice[] {
  if (!Array.isArray(answer)) return [];
  return answer.filter(
    (spell): spell is SpellChoice =>
      typeof spell === "object" && spell !== null && typeof spell.name === "string" && typeof spell.level === "number",
  );
}

const levelOf = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);

/** A spell outside the level range of the field is kept but flagged (suggestion, never blocking). */
export function isOutsideLevelRange(spell: SpellChoice, filter: SpellFilterRange | undefined): boolean {
  const min = levelOf(filter?.minLevel);
  const max = levelOf(filter?.maxLevel);
  return (min !== undefined && spell.level < min) || (max !== undefined && spell.level > max);
}

/** Codex class pre-filter: the field class when the Codex knows it. */
export function codexClassFilter(filter: SpellFilterRange | undefined): SpellClass[] {
  const className = filter?.className;
  return typeof className === "string" && (SPELL_CLASSES as readonly string[]).includes(className)
    ? [className as SpellClass]
    : [];
}

/** Codex level pre-filter: only a single-level field (cantrips) is pre-filtered. */
export function codexLevelFilter(filter: SpellFilterRange | undefined): number | null {
  const min = levelOf(filter?.minLevel);
  const max = levelOf(filter?.maxLevel);
  return min !== undefined && min === max ? min : null;
}
