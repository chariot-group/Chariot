"use client";

import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/layout/Sidebar/shared/ConfirmDialog";
import { truncateForToast } from "@/lib/truncateForSidebarMenuLabel";

export interface UnlinkNpcConfirmDialogProps {
  /** Display name of the NPC being unlinked; `null` keeps the dialog closed. */
  npcName: string | null;
  /** Display name of the Player the NPC is currently linked to. */
  playerName: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

/**
 * Confirmation shown before removing an NPC from a Player's companions (sidebar and Companions tab).
 * @see FR-sidebar-npc-link (Unlink confirmation), FR-npc-player-link
 */
export function UnlinkNpcConfirmDialog({
  npcName,
  playerName,
  onCancel,
  onConfirm,
  isLoading,
}: UnlinkNpcConfirmDialogProps) {
  const t = useTranslations("sidebar");
  const unnamed = t("unnamedCharacter");

  return (
    <ConfirmDialog
      open={npcName !== null}
      onOpenChange={(open) => {
        if (!open && !isLoading) onCancel();
      }}
      title={t("unlinkNpcDialogTitle")}
      description={t("unlinkNpcDialogDescription", {
        npc: truncateForToast(npcName || unnamed),
        player: truncateForToast(playerName || unnamed),
      })}
      confirmLabel={t("unlinkNpcConfirm")}
      cancelLabel={t("cancel")}
      onConfirm={onConfirm}
      isLoading={isLoading}
      destructive={false}
      confirmVariant="primary"
    />
  );
}
