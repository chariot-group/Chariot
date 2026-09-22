"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { characterDisplayName } from "@/lib/duplicateName";
import { linkedPlayerIdOf, playersForNpcLinkPicker } from "@/lib/npcPlayerLink";
import type { Character, NPC } from "@/types/character";
import { cn } from "@/lib/utils";

interface LinkNpcToPlayerDialogProps {
  npc: NPC | null;
  players: Character[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPlayer: (player: Character) => void;
  isLoading?: boolean;
}

/**
 * @see FR-sidebar-npc-link
 */
export function LinkNpcToPlayerDialog({
  npc,
  players,
  open,
  onOpenChange,
  onSelectPlayer,
  isLoading = false,
}: LinkNpcToPlayerDialogProps) {
  const t = useTranslations("sidebar");
  const npcName = npc ? characterDisplayName(npc) || t("unnamedCharacter") : t("unnamedCharacter");
  const pickerPlayers = playersForNpcLinkPicker(players, {
    excludePlayerId: linkedPlayerIdOf(npc),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isLoading) return;
        onOpenChange(nextOpen);
      }}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(event) => {
          if (isLoading) event.preventDefault();
        }}>
        <DialogHeader>
          <DialogTitle>{t("linkNpcDialogTitle")}</DialogTitle>
          <DialogDescription>{t("linkNpcDialogDescription", { name: npcName })}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div
            className="flex justify-center py-4"
            aria-busy="true">
            <Loader2
              className="h-5 w-5 animate-spin"
              aria-hidden="true"
            />
            <span className="sr-only">{t("linkNpcPersisting")}</span>
          </div>
        ) : pickerPlayers.length === 0 ? (
          <p className="text-sm text-white/70">{t("linkNpcNoPlayers")}</p>
        ) : (
          <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto pr-1">
            {pickerPlayers.map((player) => {
              const playerName = characterDisplayName(player) || t("unnamedCharacter");
              return (
                <li key={player._id}>
                  <button
                    type="button"
                    onClick={() => onSelectPlayer(player)}
                    aria-label={t("linkNpcToPlayerAria", { npc: npcName, player: playerName })}
                    className={cn(
                      "flex w-full min-w-0 cursor-pointer items-center rounded-[12px] px-3 py-2 text-left text-sm text-white",
                      "hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-white/50",
                    )}>
                    <span className="min-w-0 truncate">{playerName}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
