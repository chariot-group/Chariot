/**
 * Normalizes a Codex spell school field (string label, populated object, or missing).
 * @see FR-codex-spell-school-filter
 */
export function resolveCodexSpellSchoolLabel(school: unknown): string {
  if (typeof school === "string") {
    return school.trim();
  }

  if (school && typeof school === "object" && "name" in school && typeof (school as { name: unknown }).name === "string") {
    return (school as { name: string }).name.trim();
  }

  return "";
}
