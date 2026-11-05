"use client";

import { buttonVariants } from "@/components/ui/button";
import { usePlayersWithoutGroup } from "@/hooks/useCharacter";
import {
  removeCharacterWithoutGroup,
  removePlayerSpaceNpc,
  upsertCharacterWithoutGroup,
  upsertPlayerSpaceNpc,
} from "@/store/slices/characterSlice";
import { useMemo, useState } from "react";
import { useStore } from "react-redux";
import { useLocale } from "use-intl";
import NavigationService from "@/services/NavigationService";
import type { RootState } from "@/store";
import { ChevronRight, Loader2, Swords, UserPlus } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { CreateCharacterDialog } from "@/components/dialogs/CreateCharacterDialog";
import { usePathname, useRouter } from "next/navigation";
import { clearSelectedCampaign } from "@/store/slices/campaignContextSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  selectCurrentUserParticipant,
  selectIsInSession,
  selectSessionCode,
  selectIsSessionLaunched,
} from "@/store/slices/sessionSlice";
import { useUser } from "@/hooks/useUser";
import CharacterService from "@/services/CharacterService";
import { Character, NPC } from "@/types/character";
import { isPlayer } from "@/utils/global.utils";
import { SidebarItemWithActions } from "@/components/layout/Sidebar/shared/SidebarItemWithActions";
import { ConfirmDialog } from "@/components/layout/Sidebar/shared/ConfirmDialog";
import { DeletePlayerWithCompanionsDialog } from "@/components/layout/Sidebar/shared/DeletePlayerWithCompanionsDialog";
import {
  deletePlayerCharacterWithCompanionChoice,
  linkedCompanionsForPlayer,
  syncReduxAfterPlayerDelete,
} from "@/lib/playerDeleteCompanions";
import { DuplicateCharacterDialog } from "@/components/dialogs/DuplicateCharacterDialog";
import {
  applyCompanionModeAfterPlayerCreated,
  createPlayerDuplicateFromFull,
  effectiveDuplicateCompanionMode,
  syncReduxAfterCompanionMove,
  syncReduxAfterCompanionNpcCreate,
  type PlayerDuplicateCompanionMode,
} from "@/lib/playerDuplicateCompanions";
import { ExportCharacterSheetPdfDialog } from "@/components/dialogs/ExportCharacterSheetPdfDialog";
import { LinkNpcToPlayerDialog } from "@/components/dialogs/LinkNpcToPlayerDialog";
import type { SidebarActionItem } from "@/components/layout/Sidebar/shared/sidebarActions.types";
import { buildSequentialCopyNames, characterDisplayName } from "@/lib/duplicateName";
import { showToast } from "@/lib/toast";
import { useSidebarCharacterPdfExport } from "@/hooks/useSidebarCharacterPdfExport";
import {
  buildPlayerSidebarRows,
  linkedPlayerIdOf,
  persistSidebarNpcLinkedPlayer,
  playerSpaceSidebarActionIds,
  requiresNpcLinkReassignmentConfirm,
  splitSidebarRowsBySessionCharacter,
  type PlayerSidebarRow,
} from "@/lib/npcPlayerLink";
import { SidebarCharacterKindBadge } from "@/components/layout/Sidebar/shared/SidebarCharacterKindBadge";
import { SidebarCompanionNest } from "@/components/layout/Sidebar/shared/SidebarCompanionNest";
import GmSessionPlayersSidebarSection from "@/components/layout/Sidebar/GmSessionPlayersSidebarSection";
import { SidebarCharacterAvatar } from "@/components/layout/Sidebar/shared/SidebarCharacterAvatar";
import {
  buildSidebarCharacterAvatarBatchItems,
  sidebarAvatarSourcesFromPlayerRows,
  sidebarCharacterAvatarImageUrl,
} from "@/lib/buildSidebarCharacterAvatarBatch";
import { useMediaAvatarBatch } from "@/hooks/useMediaAvatar";
import { truncateForSidebarMenuLabel } from "@/lib/truncateForSidebarMenuLabel";

/**
 * Liste des joueurs sans groupe : la zone défilante occupe toute la hauteur restante de la sidebar (sous le titre et « Créer »).
 *
 * autoFetch=false : NavigationService charge la première page à la connexion ; le hook respecte le cooldown 3 s.
 */
const OUT_OF_SESSION_CONTENT_ID = "sidebar-out-of-session-characters";

export default function CharactersWithoutGroupList() {
  const t = useTranslations("sidebar");
  const { characters, linkedNpcs, unlinkedNpcs, loading, loadingMore, hasMore, loadMoreCharacters, error } =
    usePlayersWithoutGroup(10, {
      autoFetch: false,
    });
  const router = useRouter();

  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const locale = useLocale();
  const { user } = useUser();
  const isInSession = useAppSelector(selectIsInSession);
  const sessionCode = useAppSelector(selectSessionCode);
  const isSessionLaunched = useAppSelector(selectIsSessionLaunched);
  const currentParticipant = useAppSelector((state) =>
    selectCurrentUserParticipant(state, user?.keycloakId ?? ""),
  );
  const sessionCharacterId =
    isSessionLaunched ? (currentParticipant?.characterId ?? null) : null;
  const actionsDisabled = isSessionLaunched;
  // Expanded only for the session code it was opened in: collapsed by default in every new session.
  const [outOfSessionOpenCode, setOutOfSessionOpenCode] = useState<string | null>(null);
  const { setOpenMobile } = useSidebar();
  const [characterPendingDelete, setCharacterPendingDelete] = useState<Character | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [characterToDuplicate, setCharacterToDuplicate] = useState<Character | null>(null);
  const [npcPendingLink, setNpcPendingLink] = useState<NPC | null>(null);
  const [npcPendingReassign, setNpcPendingReassign] = useState<{ npc: NPC; player: Character } | null>(null);
  const [isLinkingNpc, setIsLinkingNpc] = useState(false);
  const { characterToExport, requestCharacterPdfExport, closeExportDialog } = useSidebarCharacterPdfExport();

  const pathname = usePathname();

  const selectedCharacterId = pathname?.includes("/characters/")
    ? pathname.split("/characters/")[1]?.split("/")[0]?.split("?")[0]
    : null;

  const pendingDeleteCompanions = useMemo(() => {
    if (!characterPendingDelete || !isPlayer(characterPendingDelete)) return [];
    return linkedCompanionsForPlayer(linkedNpcs ?? [], characterPendingDelete._id);
  }, [characterPendingDelete, linkedNpcs]);

  const showPlayerCompanionDeleteDialog =
    !!characterPendingDelete && isPlayer(characterPendingDelete) && pendingDeleteCompanions.length > 0;

  const navigateAfterDelete = (deletingCharacterId: string, deleteLinkedCompanions: boolean, companions: NPC[]) => {
    const viewingDeletedSheet =
      selectedCharacterId === deletingCharacterId ||
      (deleteLinkedCompanions && companions.some((npc) => npc._id === selectedCharacterId));
    if (!viewingDeletedSheet) return;
    const nextCharacter = characters.find((character) => character._id !== deletingCharacterId);
    if (nextCharacter?._id) {
      router.replace(`/characters/${nextCharacter._id}`);
    } else {
      // FR-welcome-onboarding-fallbacks: player space fallback if a campaign exists, else welcome.
      void NavigationService.determinePlayerSpaceDestination(locale, dispatch, store.getState).then((destination) =>
        router.replace(destination.path),
      );
    }
  };

  const executeCharacterDelete = async (deleteLinkedCompanions: boolean) => {
    if (!characterPendingDelete || isDeleting) return;

    const deletingCharacterId = characterPendingDelete._id;
    const deletingPlayer = isPlayer(characterPendingDelete);

    try {
      setIsDeleting(true);
      if (deletingPlayer) {
        await deletePlayerCharacterWithCompanionChoice(deletingCharacterId, deleteLinkedCompanions);
        syncReduxAfterPlayerDelete(dispatch, {
          playerId: deletingCharacterId,
          deleteLinkedCompanions,
          companions: pendingDeleteCompanions,
        });
      } else {
        await CharacterService.deleteCharacter(deletingCharacterId);
        dispatch(removeCharacterWithoutGroup(deletingCharacterId));
        dispatch(removePlayerSpaceNpc(deletingCharacterId));
      }
      setCharacterPendingDelete(null);
      navigateAfterDelete(deletingCharacterId, deleteLinkedCompanions, pendingDeleteCompanions);
    } catch (deleteError) {
      console.error("Error deleting character:", deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCharacter = async () => {
    await executeCharacterDelete(false);
  };

  const sidebarRows = useMemo(
    () => buildPlayerSidebarRows(characters, unlinkedNpcs ?? [], linkedNpcs ?? []),
    [characters, linkedNpcs, unlinkedNpcs],
  );

  const avatarBatchItems = useMemo(
    () => buildSidebarCharacterAvatarBatchItems(sidebarAvatarSourcesFromPlayerRows(sidebarRows)),
    [sidebarRows],
  );
  const { getUrl: getAvatarUrl } = useMediaAvatarBatch(
    avatarBatchItems,
    isInSession ? sessionCode : null,
    avatarBatchItems.length > 0,
  );

  const sessionSplit = useMemo(
    () => splitSidebarRowsBySessionCharacter(sidebarRows, sessionCharacterId),
    [sidebarRows, sessionCharacterId],
  );
  const outOfSessionOpen = Boolean(sessionCode) && outOfSessionOpenCode === sessionCode;
  const hiddenActiveCharacter =
    sessionSplit && !outOfSessionOpen && selectedCharacterId
      ? sessionSplit.otherRows
          .flatMap((row) => [row.character, ...(row.type === "player" ? row.companions : [])])
          .find((character) => character._id === selectedCharacterId)
      : undefined;
  const outOfSessionActiveTooltip = hiddenActiveCharacter
    ? t("outOfSessionActiveTooltip", { name: characterDisplayName(hiddenActiveCharacter) || t("unnamedCharacter") })
    : null;

  const renderRowAvatar = (characterId: string, storedValue: string | undefined, alt: string) => (
    <SidebarCharacterAvatar
      characterId={characterId}
      storedValue={storedValue}
      alt={alt}
      sessionCode={isInSession ? sessionCode : null}
      avatarImageUrl={sidebarCharacterAvatarImageUrl(getAvatarUrl, characterId, storedValue)}
    />
  );

  const existingCharacterNames = useMemo(
    () => characters.map((c) => characterDisplayName(c)).filter(Boolean),
    [characters],
  );

  const duplicateCompanionsPreview = useMemo(() => {
    if (!characterToDuplicate || !isPlayer(characterToDuplicate)) return [];
    return linkedCompanionsForPlayer(linkedNpcs ?? [], characterToDuplicate._id);
  }, [characterToDuplicate, linkedNpcs]);

  const existingNpcDisplayNames = useMemo(
    () => [...(linkedNpcs ?? []), ...(unlinkedNpcs ?? [])].map((npc) => characterDisplayName(npc)).filter(Boolean),
    [linkedNpcs, unlinkedNpcs],
  );

  const handleDuplicateCharacter = async (
    character: Character,
    name: string,
    count: number,
    companionMode: PlayerDuplicateCompanionMode = "playerOnly",
  ) => {
    try {
      const copyNames = buildSequentialCopyNames(name, count);
      const companions = isPlayer(character) ? linkedCompanionsForPlayer(linkedNpcs ?? [], character._id) : [];
      const mode = effectiveDuplicateCompanionMode(companionMode, count);

      if (!isPlayer(character)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, createdBy, deletedAt, groups, ...rest } = character;
        let lastCreated: Character | null = null;
        for (const copyName of copyNames) {
          const payload = { ...rest, firstname: copyName, lastname: "", groups: [] as [] };
          const created = await CharacterService.createCharacter("npcs", payload);
          dispatch(upsertPlayerSpaceNpc(created as NPC));
          lastCreated = created as Character;
        }
        showToast(t("duplicateCharacterSuccess"), "success");
        if (count === 1 && lastCreated) router.push(`/characters/${lastCreated._id}`);
        return;
      }

      let npcNames = [...existingNpcDisplayNames];
      let lastCreated: Character | null = null;
      for (const copyName of copyNames) {
        const created = await createPlayerDuplicateFromFull(character, copyName, []);
        dispatch(upsertCharacterWithoutGroup(created as Character));
        lastCreated = created as Character;

        const { createdCompanions, movedCompanions, nextNpcNames } = await applyCompanionModeAfterPlayerCreated({
          mode,
          newPlayerId: created._id,
          companions,
          existingNpcNames: npcNames,
        });
        npcNames = nextNpcNames;
        for (const npc of createdCompanions) {
          syncReduxAfterCompanionNpcCreate(dispatch, npc);
        }
        syncReduxAfterCompanionMove(dispatch, movedCompanions);
      }

      showToast(t("duplicateCharacterSuccess"), "success");
      if (count === 1 && lastCreated) router.push(`/characters/${lastCreated._id}`);
    } catch {
      showToast(t("duplicateCharacterError"), "error");
      throw new Error("duplicate failed");
    }
  };

  const persistNpcLink = async (npc: NPC, linkedPlayerId: string | null) => {
    if (isLinkingNpc) return;
    setIsLinkingNpc(true);
    try {
      const updated = await persistSidebarNpcLinkedPlayer(
        npc,
        linkedPlayerId,
        (id, payload) => CharacterService.updateCharacter("npcs", id, payload) as Promise<NPC>,
      );
      dispatch(upsertPlayerSpaceNpc(updated));
      showToast(linkedPlayerId ? t("linkNpcSuccess") : t("unlinkNpcSuccess"), "success");
      setNpcPendingLink(null);
      setNpcPendingReassign(null);
    } catch {
      showToast(linkedPlayerId ? t("linkNpcError") : t("unlinkNpcError"), "error");
    } finally {
      setIsLinkingNpc(false);
    }
  };

  const handlePickLinkPlayer = (player: Character) => {
    if (!npcPendingLink || isLinkingNpc) return;
    if (requiresNpcLinkReassignmentConfirm(linkedPlayerIdOf(npcPendingLink), player._id)) {
      setNpcPendingLink(null);
      setNpcPendingReassign({ npc: npcPendingLink, player });
      return;
    }
    void persistNpcLink(npcPendingLink, player._id);
  };

  const unlinkNpcMenuLabels = (npc: Character): { label: string; labelTitle?: string } => {
    const linkedPlayerId = isPlayer(npc) ? null : linkedPlayerIdOf(npc as NPC);
    const linkedPlayer = linkedPlayerId ? characters.find((c) => c._id === linkedPlayerId) : undefined;
    const linkedPlayerName = linkedPlayer ? characterDisplayName(linkedPlayer) : "";
    if (!linkedPlayerName) {
      return { label: t("unlinkNpc") };
    }
    const fullLabel = t("unlinkNpcFrom", { name: linkedPlayerName });
    const shortName = truncateForSidebarMenuLabel(linkedPlayerName);
    const label = shortName === linkedPlayerName.trim() ? fullLabel : t("unlinkNpcFrom", { name: shortName });
    return {
      label,
      labelTitle: label === fullLabel ? undefined : fullLabel,
    };
  };

  const buildCharacterActions = (character: Character): SidebarActionItem[] => {
    const npcPdfExportDisabled = !isPlayer(character);
    const actionMap: Record<string, SidebarActionItem> = {
      exportPdf: {
        id: "exportPdf",
        label: t("exportPdf"),
        disabled: npcPdfExportDisabled,
        disabledTooltip: npcPdfExportDisabled ? t("exportPdfNpcComingSoon") : undefined,
        onSelect: () => {
          if (npcPdfExportDisabled) return;
          void requestCharacterPdfExport(character._id);
        },
      },
      link: {
        id: "link",
        label: t("linkNpc"),
        onSelect: () => setNpcPendingLink(character as NPC),
      },
      unlink: {
        id: "unlink",
        ...unlinkNpcMenuLabels(character),
        onSelect: () => {
          void persistNpcLink(character as NPC, null);
        },
      },
      reassign: {
        id: "reassign",
        label: t("reassignNpc"),
        onSelect: () => setNpcPendingLink(character as NPC),
      },
      duplicate: {
        id: "duplicate",
        label: t("duplicate"),
        onSelect: () => setCharacterToDuplicate(character),
      },
      edit: {
        id: "edit",
        label: t("edit"),
        onSelect: () => {
          router.push(`/characters/${character._id}?mode=edit`);
          setOpenMobile(false);
        },
      },
      delete: {
        id: "delete",
        label: t("delete"),
        variant: "destructive",
        onSelect: () => setCharacterPendingDelete(character),
      },
    };

    return playerSpaceSidebarActionIds(character, { actionsDisabled })
      .map((id) => actionMap[id])
      .filter((item): item is SidebarActionItem => Boolean(item));
  };

  if (loading && characters.length === 0) {
    return (
      <nav
        className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-4 focus-visible:outline-none"
        aria-label={t("playerNavigation")}>
        <GmSessionPlayersSidebarSection />
        <div className="flex justify-center items-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        </div>
      </nav>
    );
  }

  if (error) {
    return (
      <nav
        className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-4 focus-visible:outline-none"
        aria-label={t("playerNavigation")}>
        <GmSessionPlayersSidebarSection />
      </nav>
    );
  }

  const loadMoreButton = hasMore ? (
    <button
      type="button"
      key="characters-without-group-load-more"
      onClick={() => void loadMoreCharacters()}
      disabled={loadingMore}
      aria-busy={loadingMore}
      aria-label={t("loadMoreCharactersAria")}
      className="text-xs shrink-0 cursor-pointer rounded-[12px] py-1.5 px-3 text-white/90 text-center transition-all duration-100 w-full border border-white/25 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed focus-visible:border">
      {loadingMore ? (
        <Loader2
          className="w-4 h-4 animate-spin mx-auto"
          aria-hidden
        />
      ) : (
        t("loadMoreCharacters")
      )}
    </button>
  ) : null;

  const renderRow = (row: PlayerSidebarRow, index: number) => {
    const character = row.character;
    const isNpcRow = row.type === "npc" || !isPlayer(character);
    const isSelected = selectedCharacterId === character._id;
    const displayName = characterDisplayName(character) || t("unnamedCharacter");
    const isSessionCharacter = sessionCharacterId === character._id;
    const characterActions = buildCharacterActions(character);
    const kindLabel = isNpcRow ? t("npcKind") : t("playerKind");
    const companions = row.type === "player" ? row.companions : [];

    const playerLinkLabel = `${displayName}${isSelected ? ` (${t("selected")})` : ""}`;

    const renderPlayerLink = (nestOpen: boolean, inNestHeader: boolean) => (
      <Link
        href={`/characters/${character._id}`}
        aria-current={isSelected ? "page" : undefined}
        aria-label={playerLinkLabel}
        onClick={() => dispatch(clearSelectedCampaign())}
        className={cn(
          "relative flex min-w-0 flex-1 shrink-0 cursor-pointer items-center gap-2 text-sm focus-visible:ring-1 focus-visible:ring-white/50",
          inNestHeader ? "justify-between py-0 pr-1" : "justify-between rounded-[12px] py-1.5 px-3",
          isSelected && "font-bold",
        )}>
        {renderRowAvatar(character._id, character.avatar, displayName)}
        <span className={cn("min-w-0 flex-1 truncate text-left", (isSelected || nestOpen) && "font-bold")}>
          {displayName}
        </span>
        {isSessionCharacter && (
          <Swords
            aria-label={t("sessionCharacter")}
            className="ml-1 h-3.5 w-3.5 shrink-0 text-yellow"
          />
        )}
      </Link>
    );

    if (row.type !== "player") {
      const npcRowHeader = (
        <SidebarItemWithActions
          actions={characterActions}
          disabled={characterActions.length === 0}
          contextMenuLabel={t("characterActions")}
          className={cn(
            "rounded-[12px] transition-all duration-150",
            isSelected ? "bg-white/15 text-white" : "hover:bg-white/10",
          )}>
          <Link
            href={`/characters/${character._id}`}
            aria-current={isSelected ? "page" : undefined}
            aria-label={`${displayName} (${kindLabel})${isSelected ? ` (${t("selected")})` : ""}`}
            onClick={() => dispatch(clearSelectedCampaign())}
            className={cn(
              "relative flex min-w-0 flex-1 shrink-0 cursor-pointer items-center gap-2 py-1.5 px-3 text-sm focus-visible:ring-1 focus-visible:ring-white/50",
              isSelected && "font-bold",
            )}>
            {renderRowAvatar(character._id, character.avatar, displayName)}
            <span className={cn("min-w-0 flex-1 truncate", isSelected && "font-bold")}>{displayName}</span>
            <SidebarCharacterKindBadge
              label={kindLabel}
              selected={isSelected}
            />
          </Link>
        </SidebarItemWithActions>
      );
      return <div key={character._id ?? `character-${index}`}>{npcRowHeader}</div>;
    }

    const companionIds = companions.map((npc) => npc._id).filter(Boolean) as string[];

    if (companionIds.length === 0) {
      return (
        <SidebarItemWithActions
          key={character._id ?? `character-${index}`}
          actions={characterActions}
          disabled={characterActions.length === 0}
          contextMenuLabel={t("characterActions")}
          className={cn(
            "rounded-[12px] transition-all duration-150",
            isSelected ? "bg-white/15 text-white" : "hover:bg-white/10",
          )}>
          {renderPlayerLink(false, false)}
        </SidebarItemWithActions>
      );
    }

    return (
      <SidebarCompanionNest
        key={character._id ?? `character-${index}`}
        nestId={character._id}
        playerName={displayName}
        companionCharacterIds={companionIds}
        selectedCharacterId={selectedCharacterId}
        headerSelected={isSelected}
        activeCompanionName={(() => {
          const active = companions.find((npc) => npc._id === selectedCharacterId);
          return active ? characterDisplayName(active) || t("unnamedCharacter") : null;
        })()}
        actions={characterActions}
        actionsDisabled={characterActions.length === 0}
        contextMenuLabel={t("characterActions")}
        rowBody={({ isOpen }) => renderPlayerLink(isOpen, true)}>
        {companions.map((npc) => {
          const npcSelected = selectedCharacterId === npc._id;
          const npcName = characterDisplayName(npc) || t("unnamedCharacter");
          const npcActions = buildCharacterActions(npc);
          return (
            <li key={npc._id}>
              <SidebarItemWithActions
                actions={npcActions}
                disabled={npcActions.length === 0}
                contextMenuLabel={t("characterActions")}
                className={cn(
                  "rounded-[12px] transition-all duration-100",
                  npcSelected ? "bg-white/15 text-white" : "hover:bg-white/10",
                )}>
                <Link
                  href={`/characters/${npc._id}`}
                  aria-current={npcSelected ? "page" : undefined}
                  aria-label={`${npcName} (${t("npcKind")})${npcSelected ? ` (${t("selected")})` : ""}`}
                  onClick={() => dispatch(clearSelectedCampaign())}
                  className={cn(
                    "relative flex min-w-0 flex-1 shrink-0 cursor-pointer items-center gap-2 py-1.5 px-3 focus-visible:ring-1 focus-visible:ring-white/50",
                    npcSelected && "font-bold",
                  )}>
                  {renderRowAvatar(npc._id, npc.avatar, npcName)}
                  <span className={cn("text-sm min-w-0 flex-1 truncate", npcSelected && "font-bold")}>{npcName}</span>
                  <SidebarCharacterKindBadge
                    label={t("npcKind")}
                    selected={npcSelected}
                  />
                </Link>
              </SidebarItemWithActions>
            </li>
          );
        })}
      </SidebarCompanionNest>
    );
  };

  return (
    <nav
      className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-4 focus-visible:outline-none"
      aria-label={t("playerNavigation")}>
      <GmSessionPlayersSidebarSection />

      <h2 className="shrink-0 text-lg text-white">{t("yourCharacters")}</h2>

      <CreateCharacterDialog>
        <button
          type="button"
          aria-label={t("createCharacter")}
          className={cn(buttonVariants({ variant: "primary", align: "start" }), "w-full shrink-0")}>
          {t("createCharacter")}
          <UserPlus
            aria-hidden="true"
            className="size-5"
          />
        </button>
      </CreateCharacterDialog>

      <div className="mt-1 flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain scroll-smooth pt-0.5 pr-0.5 scrollbar-none">
        {sessionSplit ? (
          <>
            <section aria-label={t("sessionCharacterSection")}>{renderRow(sessionSplit.sessionRow, 0)}</section>
            {sessionSplit.otherRows.length === 0 && loadMoreButton}
            {sessionSplit.otherRows.length > 0 && (
              <>
                <hr
                  aria-hidden="true"
                  className="my-1 shrink-0 border-white/20"
                />
                <Collapsible
                  open={outOfSessionOpen}
                  onOpenChange={(open) => setOutOfSessionOpenCode(open ? sessionCode : null)}
                  className="flex flex-col gap-2">
                  <CollapsibleTrigger
                    type="button"
                    aria-controls={OUT_OF_SESSION_CONTENT_ID}
                    aria-label={t(outOfSessionOpen ? "outOfSessionCollapseAria" : "outOfSessionExpandAria", {
                      count: sessionSplit.otherRows.length,
                    })}
                    title={outOfSessionActiveTooltip ?? undefined}
                    className={cn(
                      "flex w-full shrink-0 cursor-pointer items-center gap-2 rounded-[12px] py-1.5 px-3 text-sm text-white/80 transition-all duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50",
                      outOfSessionActiveTooltip && "bg-white/10 text-white",
                      outOfSessionOpen && "font-bold text-white",
                    )}>
                    <ChevronRight
                      aria-hidden="true"
                      className={cn("h-4 w-4 shrink-0 transition-all duration-100", outOfSessionOpen && "rotate-90")}
                    />
                    <span className="min-w-0 flex-1 truncate text-left">
                      {t("outOfSessionToggle", { count: sessionSplit.otherRows.length })}
                    </span>
                    {outOfSessionActiveTooltip ? <span className="sr-only">{outOfSessionActiveTooltip}</span> : null}
                  </CollapsibleTrigger>
                  <CollapsibleContent
                    id={OUT_OF_SESSION_CONTENT_ID}
                    className="flex flex-col gap-2">
                    {sessionSplit.otherRows.map((row, index) => renderRow(row, index + 1))}
                    {loadMoreButton}
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </>
        ) : (
          <>
            {sidebarRows.map((row, index) => renderRow(row, index))}
            {loadMoreButton}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!characterPendingDelete && !showPlayerCompanionDeleteDialog}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setCharacterPendingDelete(null);
        }}
        title={t("deleteCharacterDialogTitle")}
        description={t("deleteCharacterDialogDescription")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={handleDeleteCharacter}
        isLoading={isDeleting}
      />

      <DeletePlayerWithCompanionsDialog
        open={showPlayerCompanionDeleteDialog}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setCharacterPendingDelete(null);
        }}
        playerName={characterDisplayName(characterPendingDelete!)}
        companions={pendingDeleteCompanions}
        isLoading={isDeleting}
        title={t("deletePlayerWithCompanionsTitle")}
        description={t("deletePlayerWithCompanionsDescription")}
        companionsListLabel={t("deletePlayerWithCompanionsListLabel")}
        cancelLabel={t("cancel")}
        keepCompanionsLabel={t("deletePlayerKeepCompanions")}
        deleteAllLabel={t("deletePlayerAndCompanions", { count: pendingDeleteCompanions.length })}
        keepCompanionsAriaLabel={t("deletePlayerKeepCompanionsAria")}
        deleteAllAriaLabel={t("deletePlayerAndCompanionsAria", {
          count: pendingDeleteCompanions.length,
        })}
        onKeepCompanions={() => executeCharacterDelete(false)}
        onDeleteWithCompanions={() => executeCharacterDelete(true)}
      />

      <DuplicateCharacterDialog
        character={characterToDuplicate}
        open={!!characterToDuplicate}
        onOpenChange={(open) => {
          if (!open) setCharacterToDuplicate(null);
        }}
        existingNames={existingCharacterNames}
        companions={duplicateCompanionsPreview}
        onDuplicate={(name, count, companionMode) =>
          handleDuplicateCharacter(characterToDuplicate!, name, count, companionMode)
        }
      />

      <ExportCharacterSheetPdfDialog
        character={characterToExport}
        open={!!characterToExport}
        onOpenChange={closeExportDialog}
      />

      <LinkNpcToPlayerDialog
        npc={npcPendingLink}
        players={characters}
        open={!!npcPendingLink}
        onOpenChange={(open) => {
          if (!open && !isLinkingNpc) setNpcPendingLink(null);
        }}
        onSelectPlayer={handlePickLinkPlayer}
        isLoading={isLinkingNpc}
      />

      <ConfirmDialog
        open={!!npcPendingReassign}
        onOpenChange={(open) => {
          if (!open && !isLinkingNpc) setNpcPendingReassign(null);
        }}
        title={t("reassignNpcDialogTitle")}
        description={t("reassignNpcDialogDescription", {
          name: npcPendingReassign
            ? characterDisplayName(npcPendingReassign.player) || t("unnamedCharacter")
            : t("unnamedCharacter"),
        })}
        confirmLabel={t("reassignNpcConfirm")}
        cancelLabel={t("cancel")}
        onConfirm={() => {
          if (!npcPendingReassign) return;
          void persistNpcLink(npcPendingReassign.npc, npcPendingReassign.player._id);
        }}
        isLoading={isLinkingNpc}
        destructive={false}
      />
    </nav>
  );
}
