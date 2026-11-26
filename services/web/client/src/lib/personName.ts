/**
 * Person name rules (firstName / lastName), client-side mirror for instant feedback.
 * The API stays the authority: it validates and normalizes the case before saving.
 * Keep in sync with `services/adventure/api/src/common/person-name/person-name.ts`
 * and the Keycloak user-profile validators.
 * @see FR-user-profile-keycloak
 */

export const PERSON_NAME_MIN_LENGTH = 1;
export const PERSON_NAME_MAX_LENGTH = 50;

export const PERSON_NAME_PATTERN = /^\p{L}[\p{L}\p{M}]*(?:[ '-]\p{L}[\p{L}\p{M}]*)*$/u;

/** Trim, collapse whitespace, NFC, typographic apostrophe → `'`. */
export function cleanPersonName(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/[’‘ʼ]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export type PersonNameIssue = "required" | "tooLong" | "invalidCharacters";

/** Returns the first rule broken by the value (measured after cleanup), or null when valid. */
export function getPersonNameIssue(raw: string): PersonNameIssue | null {
  const value = cleanPersonName(raw);
  if (value.length === 0) return "required";
  if (value.length > PERSON_NAME_MAX_LENGTH) return "tooLong";
  if (!PERSON_NAME_PATTERN.test(value)) return "invalidCharacters";
  return null;
}
