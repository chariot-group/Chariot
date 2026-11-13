import { characterDisplayName } from "@/lib/duplicateName";
import type { NPC } from "@/types/character";

/** Lower-case, diacritic-free form used to compare a query with companion names. */
export function normalizeCompanionSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .trim();
}

/**
 * Companions whose display name or nickname contains the query (case and diacritics ignored).
 * A blank query returns the list unchanged; input order is preserved.
 * @see FR-npc-player-link — Companions tab search
 */
export function filterCompanionsByQuery(npcs: NPC[], query: string): NPC[] {
  const needle = normalizeCompanionSearchText(query);
  if (needle.length === 0) return npcs;
  return npcs.filter((npc) => {
    const name = normalizeCompanionSearchText(characterDisplayName(npc));
    const surname = normalizeCompanionSearchText(typeof npc.surname === "string" ? npc.surname : "");
    return name.includes(needle) || surname.includes(needle);
  });
}
