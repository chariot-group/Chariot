/** @see FR-character-sheet-pdf-export */

import type { Character as GroupCharacter } from "@/types/campaign";

/**
 * Groups API populates `progression` for Players and `challenge` for NPCs.
 * Only disable when we positively identify an NPC (avoids false positives on
 * partial sidebar payloads that omit both fields).
 */
export function isNpcGroupCharacter(character: GroupCharacter): boolean {
  return character.challenge != null;
}
