"use client";

import { useCallback, useState } from "react";
import { useLocale } from "next-intl";
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
  buildCodexPreselectionPath,
  campaignContextFromParams,
  linkedCreateCodexEntityLock,
  parseCodexPreselection,
  type CodexCreateSelection,
  type CodexPreselectionKind,
} from "@/lib/codexCharacterCreate";

/**
 * Community library create flow (campaign groups and Player space).
 * @see FR-codex-npc-search-entity-type
 * @see FR-player-space-codex-character-creation
 * @see FR-npc-player-link
 * @see FR-codex-share-link-preselection
 */
export default function CreateCharacterFromCodexView() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { setOpenMobile } = useSidebar();
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const linkedPlayerId = searchParams.get("linkedPlayerId");
  const codexId = typeof params.codexId === "string" ? params.codexId : null;
  const kindParam = searchParams.get("kind");
  const langParam = searchParams.get("lang");

  // Frozen at mount: the URL is rewritten as the user browses and must not re-trigger the preselection.
  const [{ preselection, preselectionInvalid }] = useState(() => {
    const parsed = parseCodexPreselection(codexId, kindParam, langParam);
    // A player entry can't be preselected in the monsters-only « create linked » flow.
    const usable = parsed && linkedPlayerId?.trim() && parsed.kind === "player" ? null : parsed;
    return { preselection: usable, preselectionInvalid: Boolean(codexId) && !usable };
  });
  const locale = useLocale();

  const lockedEntityTypeFilter =
    linkedCreateCodexEntityLock(linkedPlayerId) ??
    (preselection ? (preselection.kind === "player" ? "players" : "monsters") : undefined);

  const context = campaignContextFromParams(
    params.idCampaign as string | undefined,
    params.idGroup as string | undefined,
  );

  // Mirror the previewed entry in the URL (Player space only) so it can be copied and shared.
  const shouldMirrorUrl = !context && !linkedPlayerId?.trim();

  const handlePreviewedEntryChange = useCallback(
    (entry: { kind: CodexPreselectionKind; id: string; lang: string | null } | null) => {
      if (!shouldMirrorUrl) return;
      // Next.js syncs native history calls with its router: the URL changes without a navigation.
      window.history.replaceState(null, "", buildCodexPreselectionPath(locale, entry));
    },
    [locale, shouldMirrorUrl],
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
        initialSelection={preselection}
        initialSelectionInvalid={preselectionInvalid}
        onPreviewedEntryChange={handlePreviewedEntryChange}
      />
    </div>
  );
}
