/** @see FR-character-spell-multi-damage */

export function wrapSpellDamageDetails(value: unknown): unknown[] {
  if (value == null || value === '') {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'object') {
    return [value];
  }

  return [];
}
