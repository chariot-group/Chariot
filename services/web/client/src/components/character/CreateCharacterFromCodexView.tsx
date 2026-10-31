"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import MonsterCodexDialog from "@/components/character/MonsterCodexDialog";
import { useAppDispatch } from "@/store/hooks";
import {
  clearCodexDrafts,
  setNpcCodexDraft,
  setPlayerCodexDraft,
} from "@/store/slices/codexDraftSlice";
import { useSidebar } from "@/components/ui/sidebar";
import {
  buildCodexDraftFormPath,
  campaignContextFromParams,
  linkedCreateCodexEntityLock,
  type CodexCreateSelection,
} from "@/lib/codexCharacterCreate";

/**
 * Community library create flow (campaign groups and Player space).
 * @see FR-codex-npc-search-entity-type
 * @see FR-player-space-codex-character-creation
 * @see FR-npc-player-link
 */
export default function CreateCharacterFromCodexView() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { setOpenMobile } = useSidebar();
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const linkedPlayerId = searchParams.get("linkedPlayerId");
  const lockedEntityTypeFilter = linkedCreateCodexEntityLock(linkedPlayerId);

  const context = campaignContextFromParams(
    params.idCampaign as string | undefined,
    params.idGroup as string | undefined,
  );

  const handleCharacterSelected = (selection: CodexCreateSelection) => {
    if (selection.kind === "npc") {
      dispatch(setNpcCodexDraft(selection.draft));
    } else {
      dispatch(setPlayerCodexDraft(selection.draft));
    }
    setOpenMobile(false);
    router.push(buildCodexDraftFormPath(selection.kind, context, { linkedPlayerId }));
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      dispatch(clearCodexDrafts());
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <MonsterCodexDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onCharacterSelected={handleCharacterSelected}
        lockedEntityTypeFilter={lockedEntityTypeFilter}
      />
    </div>
  );
}
