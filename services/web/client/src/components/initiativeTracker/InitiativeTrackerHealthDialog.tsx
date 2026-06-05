"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SessionHealthDialog } from "@/components/character/session/SessionHealthDialog";
import CharacterService from "@/services/CharacterService";
import type { NPC, Player } from "@/types/character";
import type { InitiativeTrackerRow } from "@/store/slices/sessionSlice";
import { isPlayer } from "@/utils/global.utils";
import { trackerStatusFieldsFromCharacter } from "@/components/initiativeTracker/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

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

export function InitiativeTrackerHealthDialog({
  row,
  open,
  onOpenChange,
  sessionCode,
  onTrackerRowUpdate,
}: InitiativeTrackerHealthDialogProps) {
  const t = useTranslations("characterDetail.battle");
  const [character, setCharacter] = useState<Player | NPC | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !row) {
      setCharacter(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setCharacter(null);

    void CharacterService.getCharacterById(row.characterId, { sessionCode })
      .then((fetched) => {
        if (!cancelled) {
          setCharacter(fetched as Player | NPC);
        }
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          onOpenChange(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, onOpenChange, row, sessionCode]);

  if (!row) {
    return null;
  }

  if (loading || !character) {
    return (
      <Dialog
        open={open}
        onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl p-6">
          <DialogHeader>
            <DialogTitle>{t("sessionHpDialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <Loader2
              className="size-8 animate-spin text-muted-foreground"
              aria-hidden
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const characterType = isPlayer(character) ? "players" : "npcs";

  return (
    <SessionHealthDialog
      open={open}
      onOpenChange={onOpenChange}
      character={character}
      characterType={characterType}
      sessionCode={sessionCode}
      onCharacterUpdate={(updated) => {
        onTrackerRowUpdate(row.id, trackerStatusFieldsFromCharacter(updated));
        setCharacter(updated);
      }}
    />
  );
}
