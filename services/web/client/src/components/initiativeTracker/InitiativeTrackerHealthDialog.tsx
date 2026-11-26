"use client";

import { useEffect, useRef, useState } from "react";
import { SessionHealthDialog } from "@/components/character/session/SessionHealthDialog";
import CharacterService from "@/services/CharacterService";
import type { NPC, Player } from "@/types/character";
import type { InitiativeTrackerRow } from "@/store/slices/sessionSlice";
import { isPlayer } from "@/utils/global.utils";
import { trackerStatusFieldsFromCharacter } from "@/components/initiativeTracker/utils";

/**
 * FR-combat-initiative-tracker — character shown while the full sheet loads, built from the row mirror
 * (HP, max, temp, death save failures) so the dialog opens at once without a loader.
 */
export function provisionalCharacterFromTrackerRow(row: InitiativeTrackerRow, knownSuccesses = 0): Player | NPC {
  const base = {
    _id: row.characterId,
    stats: {
      currentHitPoints: row.hitPoints,
      maxHitPoints: row.maxHitPoints,
      tempHitPoints: row.tempHitPoints,
    },
  };
  if (row.kind === "player") {
    // `progression` marks a player for `isPlayer`; successes are not mirrored on the row (last known value).
    return {
      ...base,
      progression: {},
      deathSaves: { successes: knownSuccesses, failures: row.deathSavesFailures ?? 0 },
    } as unknown as Player;
  }
  return base as unknown as NPC;
}

type InitiativeTrackerHealthDialogProps = {
  row: InitiativeTrackerRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionCode: string | null;
  onTrackerRowUpdate: (
    rowId: string,
    changes: Pick<
      InitiativeTrackerRow,
      "hitPoints" | "maxHitPoints" | "tempHitPoints" | "kind" | "deathSavesFailures"
    >,
  ) => void;
};

/** Last death save successes seen per character, so reopening the dialog does not flash them to 0. */
const knownDeathSaveSuccesses = new Map<string, number>();

function rememberDeathSaves(character: Player | NPC) {
  if (isPlayer(character)) knownDeathSaveSuccesses.set(character._id, character.deathSaves?.successes ?? 0);
}

export function InitiativeTrackerHealthDialog({
  row,
  open,
  onOpenChange,
  sessionCode,
  onTrackerRowUpdate,
}: InitiativeTrackerHealthDialogProps) {
  const [character, setCharacter] = useState<Player | NPC | null>(null);
  // The parent passes a new `onOpenChange` and a new `row` object on every render (a save updates the row):
  // the fetch MUST only rerun when the dialog opens or targets another character, otherwise the dialog
  // reloads after each death save / HP change (FR-combat-initiative-tracker).
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const characterId = row?.characterId ?? null;

  useEffect(() => {
    if (!open || !characterId) {
      setCharacter(null);
      return;
    }

    let cancelled = false;
    setCharacter(null);

    void CharacterService.getCharacterById(characterId, { sessionCode })
      .then((fetched) => {
        if (!cancelled) {
          rememberDeathSaves(fetched as Player | NPC);
          setCharacter(fetched as Player | NPC);
        }
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          onOpenChangeRef.current(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, characterId, sessionCode]);

  if (!row) {
    return null;
  }

  // Until the sheet arrives, the dialog already shows the row values with its controls disabled.
  const shownCharacter =
    character ?? provisionalCharacterFromTrackerRow(row, knownDeathSaveSuccesses.get(row.characterId) ?? 0);
  const characterType = isPlayer(shownCharacter) ? "players" : "npcs";

  return (
    <SessionHealthDialog
      open={open}
      onOpenChange={onOpenChange}
      character={shownCharacter}
      characterType={characterType}
      sessionCode={sessionCode}
      showDeathSaves
      pending={character == null}
      onCharacterUpdate={(updated) => {
        onTrackerRowUpdate(row.id, trackerStatusFieldsFromCharacter(updated));
        rememberDeathSaves(updated);
        setCharacter(updated);
      }}
    />
  );
}
