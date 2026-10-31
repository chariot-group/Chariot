"use client";

import { useCallback, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import MonsterCodexDialog from "@/components/character/MonsterCodexDialog";
import { useStore } from "react-redux";
import type { RootState } from "@/store";
import NavigationService from "@/services/NavigationService";
import { useKeycloak } from "@/providers/KeycloakProvider";
import { useAppDispatch } from "@/store/hooks";
import { clearCodexDrafts, setNpcCodexDraft, setPlayerCodexDraft } from "@/store/slices/codexDraftSlice";
import { useSidebar } from "@/components/ui/sidebar";
import {
  buildCodexDraftFormPath,
  buildCodexPreselectionPath,
  campaignContextFromParams,
  linkedCreateCodexEntityLock,
  parseCodexPreselection,
  shouldRedirectOnCodexClose,
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
function CreateCharacterFromCodexContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
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
  // Closing clears the previewed entry: mirroring that would swap the route and reopen the dialog.
  const isClosingRef = useRef(false);

  const handlePreviewedEntryChange = useCallback(
    (entry: { kind: CodexPreselectionKind; id: string; lang: string | null } | null) => {
      if (!shouldMirrorUrl || isClosingRef.current) return;
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

  const redirectOnClose = shouldRedirectOnCodexClose({
    context,
    linkedPlayerId,
    fromShareLink: Boolean(codexId),
  });

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      isClosingRef.current = true;
      dispatch(clearCodexDrafts());
      if (redirectOnClose) {
        // First Player-space character, else the welcome page.
        void NavigationService.determinePlayerSpaceDestination(locale, dispatch, store.getState.bind(store)).then(
          (destination) => router.replace(destination.path),
        );
      }
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
        skipBackOnClose={redirectOnClose}
      />
    </div>
  );
}

/**
 * The share link loads its entry on open: mount only once the SSO session is ready. The link params
 * are frozen when the content mounts, so they must be read after the login redirect has settled.
 */
export default function CreateCharacterFromCodexView() {
  const { loading, authenticated, userTransitioning } = useKeycloak();
  if (loading || userTransitioning || !authenticated) return null;
  return <CreateCharacterFromCodexContent />;
}
