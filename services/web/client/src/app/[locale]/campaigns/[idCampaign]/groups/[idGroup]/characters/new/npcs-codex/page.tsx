"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import MonsterCodexDialog from "@/components/character/MonsterCodexDialog";
import { NPC } from "@/types/character";
import { useAppDispatch } from "@/store/hooks";
import { clearNpcCodexDraft, setNpcCodexDraft } from "@/store/slices/codexDraftSlice";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Page for creating an NPC from Codex
 * Opens the monster search dialog and redirects to NPC creation with pre-filled data
 * Route: /campaigns/[idCampaign]/groups/[idGroup]/characters/new/npcs-codex
 */
export default function CreateNpcFromCodexPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { setOpenMobile } = useSidebar();
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const campaignId = params.idCampaign as string;
  const groupId = params.idGroup as string;

  const handleMonsterSelected = (monster: Partial<NPC>) => {
    dispatch(setNpcCodexDraft(monster));
    setOpenMobile(false);

    // Rediriger vers la page de création de NPC (lecture des données via store mémoire)
    router.push(`/campaigns/${campaignId}/groups/${groupId}/characters/new/npcs?fromCodex=1`);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      dispatch(clearNpcCodexDraft());
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <MonsterCodexDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onMonsterSelected={handleMonsterSelected}
      />
    </div>
  );
}
