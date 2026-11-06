import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Selected spellcasting block and spell of the Magic tab (`spell` = index in the block's spell
 * list; null = first in display order). Held by the tab container so it survives switching between
 * read and edit modes.
 * @see FR-character-magic-list-card
 */
export interface MagicSelection {
  block: number;
  spell: number | null;
}

export type MagicSelectionState = [MagicSelection, Dispatch<SetStateAction<MagicSelection>>];

export const INITIAL_MAGIC_SELECTION: MagicSelection = { block: 0, spell: null };

/** Selection from the container when given, else local state (standalone renders, tests). */
export function useMagicSelection(controlled?: MagicSelectionState) {
  const local = useState<MagicSelection>(INITIAL_MAGIC_SELECTION);
  const [selection, setSelection] = controlled ?? local;

  /** Switching block resets the spell to the first one of that block. */
  const setBlock = useCallback((block: number) => setSelection({ block, spell: null }), [setSelection]);
  const setSpell = useCallback(
    (next: SetStateAction<number | null>) =>
      setSelection((prev) => ({ ...prev, spell: typeof next === "function" ? next(prev.spell) : next })),
    [setSelection],
  );

  return { selection, setBlock, setSpell };
}
