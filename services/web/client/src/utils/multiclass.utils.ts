/**
 * Multiclass helpers of the PC edit form.
 * @see FR-character-general-bento-layout (Multiclass edit tabs)
 */

/** A PC has at most two classes. */
export const MAX_CLASSES = 2;
export const MAX_CHARACTER_LEVEL = 20;

/** Hit die side of each class (SRD). */
export const HIT_DIE_BY_CLASS: Record<string, number> = {
  Barbarian: 12,
  Fighter: 10,
  Paladin: 10,
  Ranger: 10,
  Sorcerer: 6,
  Wizard: 6,
  Artificer: 8,
  Bard: 8,
  Cleric: 8,
  Druid: 8,
  Monk: 8,
  Rogue: 8,
  Warlock: 8,
};

export function defaultHitDie(className: string | undefined | null): number | undefined {
  return className ? HIT_DIE_BY_CLASS[className] : undefined;
}

type ClassEntry = { name?: string; level?: unknown; [key: string]: unknown };

const toLevel = (value: unknown) => Math.max(0, Math.floor(Number(value) || 0));

/**
 * Values after adding a class at level 1, keeping class levels within the global level:
 * when every level is already allocated, the global level goes up by one (multiclassing on level-up);
 * at the level cap, the new level is taken from the highest class instead.
 * Returns `null` when no class can be added.
 */
export function addClassLevels(
  globalLevel: unknown,
  classes: ClassEntry[],
): { globalLevel: number; classes: ClassEntry[] } | null {
  if (classes.length >= MAX_CLASSES) return null;

  const global = Math.max(1, toLevel(globalLevel));
  const allocated = classes.reduce((sum, c) => sum + toLevel(c.level), 0);
  const newClass: ClassEntry = { name: undefined, subclass: "", level: 1, hitDice: 0 };

  if (allocated < global) return { globalLevel: global, classes: [...classes, newClass] };
  if (global < MAX_CHARACTER_LEVEL) return { globalLevel: global + 1, classes: [...classes, newClass] };

  const donor = classes.reduce((best, c, i) => (toLevel(c.level) > toLevel(classes[best].level) ? i : best), 0);
  if (toLevel(classes[donor]?.level) <= 1) return null;
  const next = classes.map((c, i) => {
    if (i !== donor) return c;
    const level = toLevel(c.level) - 1;
    const remaining = typeof c.hitDiceRemaining === "number" ? Math.min(c.hitDiceRemaining, level) : c.hitDiceRemaining;
    return { ...c, level, hitDiceRemaining: remaining };
  });
  return { globalLevel: global, classes: [...next, newClass] };
}
