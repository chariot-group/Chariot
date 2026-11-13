"use client";

import { useCallback, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
import { createCharactersFromCodexSelections } from "@/lib/codexBatchCharacterCreate";
import { upsertCharacterWithoutGroup, upsertPlayerSpaceNpc } from "@/store/slices/characterSlice";
import { addCharacterToGroup } from "@/store/slices/groupSlice";
import { isPlayer } from "@/utils/global.utils";
import { toast } from "react-toastify";
import type { NPC, Player } from "@/types/character";

/**
 * Community library create flow (campaign groups and Player space).
 * @see FR-codex-search-filters
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
  const [batchCreateInProgress, setBatchCreateInProgress] = useState(false);
  const linkedPlayerId = searchParams.get("linkedPlayerId");
  const codexId = typeof params.codexId === "string" ? params.codexId : null;
  const kindParam = searchParams.get("kind");
  const langParam = searchParams.get("lang");
  const locale = useLocale();
  const tDialog = useTranslations("characterDetail.magic.monsterCodexDialog");
  const tZod = useTranslations("zodErrors");

  // Frozen at mount: the URL is rewritten as the user browses and must not re-trigger the preselection.
  const [{ preselection, preselectionInvalid }] = useState(() => {
    const parsed = parseCodexPreselection(codexId, kindParam, langParam);
    // A player entry can't be preselected in the monsters-only « create linked » flow.
    const usable = parsed && linkedPlayerId?.trim() && parsed.kind === "player" ? null : parsed;
    return { preselection: usable, preselectionInvalid: Boolean(codexId) && !usable };
  });

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

  const syncCreatedCharacterInStore = useCallback(
    (createdCharacter: Player | NPC) => {
      if (context) {
        dispatch(
          addCharacterToGroup({
            groupId: context.groupId,
            character: {
              _id: createdCharacter._id,
              firstname: createdCharacter.firstname,
              lastname: createdCharacter.lastname,
              surname: createdCharacter.surname,
              userId:
                "userId" in createdCharacter && typeof createdCharacter.userId === "string"
                  ? createdCharacter.userId
                  : undefined,
            },
          }),
        );
      } else {
        dispatch(upsertCharacterWithoutGroup(createdCharacter));
        if (!isPlayer(createdCharacter)) {
          dispatch(upsertPlayerSpaceNpc(createdCharacter as NPC));
        }
      }
    },
    [context, dispatch],
  );

  const navigateAfterBatchCreate = useCallback(() => {
    const linked = linkedPlayerId?.trim();
    if (linked) {
      router.replace(`/${locale}/characters/${linked}?tab=companions`);
      return;
    }
    if (context) {
      router.replace(`/${locale}/campaigns/${context.campaignId}/groups/${context.groupId}`);
      return;
    }
    router.replace(`/${locale}/characters`);
  }, [context, linkedPlayerId, locale, router]);

  const handleCharacterSelected = (selection: CodexCreateSelection) => {
    if (selection.kind === "npc") {
      dispatch(setNpcCodexDraft(selection.draft));
    } else {
      dispatch(setPlayerCodexDraft(selection.draft));
    }
    setOpenMobile(false);
    router.push(buildCodexDraftFormPath(selection.kind, context, { linkedPlayerId }));
  };

  const handleCharactersBatchSelected = async (selections: CodexCreateSelection[]) => {
    if (selections.length === 0) return;
    setBatchCreateInProgress(true);
    try {
      const created = await createCharactersFromCodexSelections(
        selections,
        { groupId: context?.groupId, linkedPlayerId },
        tZod,
      );
      created.forEach(syncCreatedCharacterInStore);
      toast.success(tDialog("batchCreateSuccess", { count: created.length }));
      isClosingRef.current = true;
      dispatch(clearCodexDrafts());
      setOpenMobile(false);
      setIsDialogOpen(false);
      navigateAfterBatchCreate();
    } catch (err) {
      console.error("Codex batch character create failed:", err);
      toast.error(tDialog("batchCreateError"));
    } finally {
      setBatchCreateInProgress(false);
    }
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
        onCharactersBatchSelected={handleCharactersBatchSelected}
        batchCreateInProgress={batchCreateInProgress}
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
