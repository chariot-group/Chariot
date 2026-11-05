/**
 * Pure helpers for collapsed sidebar sections that contain the displayed character sheet.
 * @see FR-sidebar-linked-npc-nesting-collapse
 * @see FR-sidebar-group-collapsed-active-indicator
 */

/** Auto-expand a companion nest only when navigation moves to one of its NPCs (never forced afterwards). */
export function shouldAutoExpandCompanionNest({
  previousSelectedId,
  selectedId,
  companionIds,
  userCollapsed,
}: {
  previousSelectedId: string | null;
  selectedId: string | null;
  companionIds: readonly string[];
  userCollapsed: boolean;
}): boolean {
  if (!selectedId || !userCollapsed || previousSelectedId === selectedId) return false;
  return companionIds.includes(selectedId);
}

/** Id of the displayed companion hidden inside a collapsed nest, otherwise `null`. */
export function collapsedActiveCompanionId(
  isOpen: boolean,
  selectedId: string | null,
  companionIds: readonly string[],
): string | null {
  if (isOpen || !selectedId) return null;
  return companionIds.includes(selectedId) ? selectedId : null;
}

/** Name of the displayed character hidden inside a collapsed group, otherwise `null`. */
export function collapsedActiveGroupCharacterId(
  isOpen: boolean,
  selectedId: string | null,
  characters: ReadonlyArray<{ _id: string }> | undefined,
): string | null {
  if (isOpen || !selectedId) return null;
  return characters?.some((character) => character._id === selectedId) ? selectedId : null;
}
