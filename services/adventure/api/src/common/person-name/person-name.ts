/**
 * Person name rules (firstName / lastName).
 * Mirrors the web client (`services/web/client/src/lib/personName.ts`) and the
 * Keycloak user-profile validators (`services/sso/keycloak-config.sh`): keep the three in sync.
 * @see FR-user-profile-keycloak: Person name rules
 */

export const PERSON_NAME_MIN_LENGTH = 1;
export const PERSON_NAME_MAX_LENGTH = 50;

/**
 * Letters (accents included) separated by a single space, apostrophe or hyphen.
 * Starts and ends with a letter, no consecutive separators, no digits.
 */
export const PERSON_NAME_PATTERN =
  /^\p{L}[\p{L}\p{M}]*(?:[ '-]\p{L}[\p{L}\p{M}]*)*$/u;

/** Trim, collapse whitespace, NFC, typographic apostrophe → `'`. */
export function cleanPersonName(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(/[’‘ʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cleanup + case normalization: first letter of each word upper-case, the
 * rest lower-case; a word starts after a space, hyphen or apostrophe.
 * Idempotent. Does not validate: an invalid value is returned cleaned.
 */
export function normalizePersonName(raw: string): string {
  const lower = cleanPersonName(raw).toLowerCase();
  return lower.replace(
    /(^|[ '-])(\p{L})/gu,
    (_m, sep: string, letter: string) => sep + letter.toUpperCase(),
  );
}

/** True when the value (after cleanup) respects shape and length rules. */
export function isValidPersonName(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const value = cleanPersonName(raw);
  return (
    value.length >= PERSON_NAME_MIN_LENGTH &&
    value.length <= PERSON_NAME_MAX_LENGTH &&
    PERSON_NAME_PATTERN.test(value)
  );
}
