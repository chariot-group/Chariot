"use client";

import * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, UserPlus } from "lucide-react";
import { Character as GroupCharacter, Group } from "@/types/campaign";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectSelectedCampaignId } from "@/store/slices/campaignContextSlice";
import {
  addCharacterToGroup,
  addGroupToStore,
  removeCharacterFromGroup,
  selectActiveGroupsHasMore,
  selectActiveGroupsTotal,
  selectArchivedGroupsHasMore,
  selectArchivedGroupsTotal,
} from "@/store/slices/groupSlice";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSidebar } from "@/components/ui/sidebar";
import { CreateCharacterDialog } from "@/components/dialogs/CreateCharacterDialog";
import { cn } from "@/lib/utils";
import { SidebarItemWithActions } from "@/components/layout/Sidebar/shared/SidebarItemWithActions";
import { ConfirmDialog } from "@/components/layout/Sidebar/shared/ConfirmDialog";
import { deletePlayerCharacterWithCompanionChoice, syncReduxAfterPlayerDelete } from "@/lib/playerDeleteCompanions";
import {
  applyCompanionModeAfterPlayerCreated,
  createPlayerDuplicateFromFull,
  effectiveDuplicateCompanionMode,
  syncReduxAfterCompanionMove,
  syncReduxAfterCompanionNpcCreate,
  type PlayerDuplicateCompanionMode,
} from "@/lib/playerDuplicateCompanions";
import type { NPC, Player } from "@/types/character";
import { EditGroupDialog } from "@/components/dialogs/EditGroupDialog";
import { MoveCharacterDialog } from "@/components/dialogs/MoveCharacterDialog";
import { DuplicateGroupDialog } from "@/components/dialogs/DuplicateGroupDialog";
import {
  LazyDeletePlayerWithCompanionsDialog,
  LazyDuplicateCharacterDialog,
  LazyExportCharacterSheetPdfDialog,
} from "@/components/lazy/lazyDialogs";
import type { SidebarActionItem } from "@/components/layout/Sidebar/shared/sidebarActions.types";
import CharacterService from "@/services/CharacterService";
import GroupService from "@/services/GroupService";
import { moveCharacterToGroup } from "@/lib/moveCharacterToGroup";
import { showToast } from "@/lib/toast";
import { canMoveCharacterToAnotherGroup } from "@/lib/canMoveCharacterToAnotherGroup";
import { buildSequentialCopyNames, characterDisplayName } from "@/lib/duplicateName";
import {
  selectIsInSession,
  selectSessionCode,
  selectIsSessionLaunched,
  selectGmGuestCharacterIds,
  addGmGuestCharacterToSession,
  removeGmGuestCharacterFromSession,
  appendInitiativeTrackerRows,
  removeInitiativeTrackerRow,
  selectBattleInitialized,
  createInitiativeTrackerRow,
  touchRemoteCharacterSheet,
} from "@/store/slices/sessionSlice";
import { SESSION_PARTICIPANTS_GROUP_ID } from "@/components/initiativeTracker/constants";
import { SESSION_PARTICIPANTS_GROUP_LABEL } from "@/lib/buildSessionParticipantsGroup";
import { useSidebarCharacterPdfExport } from "@/hooks/useSidebarCharacterPdfExport";
import { isNpcGroupCharacter } from "@/lib/isNpcGroupCharacter";
import {
  buildSidebarCharacterAvatarBatchItems,
  sidebarCharacterAvatarImageUrl,
} from "@/lib/buildSidebarCharacterAvatarBatch";
import { SidebarCharacterAvatar } from "@/components/layout/Sidebar/shared/SidebarCharacterAvatar";
import { collapsedActiveGroupCharacterId } from "@/components/layout/Sidebar/shared/sidebarCollapsedActive";
import { useMediaAvatarBatch } from "@/hooks/useMediaAvatar";
import { applyGroupLongRest } from "@/lib/groupLongRest";
import { selectUser } from "@/store/slices/userSlice";

interface GroupListProps {
  groups: Group[];
  openGroupId: string[] | null | undefined;
  onToggleGroup: (groupId: string) => void;
  isArchivedSection: boolean;
  onArchiveGroup: (groupId: string) => Promise<void>;
  onUnarchiveGroup: (groupId: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  loadedActiveGroupIds: string[];
  loadedArchivedGroupIds: string[];
  onRefreshGroups: () => Promise<void>;
}

export default function GroupList({
  groups,
  openGroupId,
  onToggleGroup,
  isArchivedSection,
  onArchiveGroup,
  onUnarchiveGroup,
  onDeleteGroup,
  loadedActiveGroupIds,
  loadedArchivedGroupIds,
  onRefreshGroups,
}: GroupListProps) {
  const t = useTranslations("sidebar");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
  const activeGroupsTotal = useAppSelector(selectActiveGroupsTotal);
  const activeGroupsHasMore = useAppSelector(selectActiveGroupsHasMore);
  const archivedGroupsTotal = useAppSelector(selectArchivedGroupsTotal);
  const archivedGroupsHasMore = useAppSelector(selectArchivedGroupsHasMore);
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const isInSession = useAppSelector(selectIsInSession);
  const sessionCode = useAppSelector(selectSessionCode);
  const isSessionLaunched = useAppSelector(selectIsSessionLaunched);
  const gmGuestCharacterIds = useAppSelector(selectGmGuestCharacterIds);
  const battleInitialized = useAppSelector(selectBattleInitialized);
  const actionsDisabled = isSessionLaunched;
  const currentUserId = useAppSelector(selectUser)?.keycloakId ?? null;

  const avatarBatchItems = React.useMemo(
    () => buildSidebarCharacterAvatarBatchItems(groups.flatMap((group) => group.characters ?? [])),
    [groups],
  );
  const { getUrl: getAvatarUrl } = useMediaAvatarBatch(
    avatarBatchItems,
    isInSession ? sessionCode : null,
    avatarBatchItems.length > 0,
  );

  const [groupPendingDelete, setGroupPendingDelete] = React.useState<Group | null>(null);
  const [groupToEdit, setGroupToEdit] = React.useState<Group | null>(null);
  const [characterPendingDelete, setCharacterPendingDelete] = React.useState<{
    character: GroupCharacter;
    groupId: string;
  } | null>(null);
  const [deleteCompanionsPreview, setDeleteCompanionsPreview] = React.useState<NPC[]>([]);
  const [loadingDeleteCompanions, setLoadingDeleteCompanions] = React.useState(false);
  const [duplicateCompanionsPreview, setDuplicateCompanionsPreview] = React.useState<NPC[]>([]);
  const [loadingDuplicateCompanions, setLoadingDuplicateCompanions] = React.useState(false);
  const [characterToMove, setCharacterToMove] = React.useState<{
    character: GroupCharacter;
    groupId: string;
  } | null>(null);
  const [characterToDuplicate, setCharacterToDuplicate] = React.useState<{
    character: GroupCharacter;
    groupId: string;
  } | null>(null);
  const [groupToDuplicate, setGroupToDuplicate] = React.useState<Group | null>(null);
  const [pendingMoveAfterDuplicate, setPendingMoveAfterDuplicate] = React.useState<{
    characters: GroupCharacter[];
    groupId: string;
  } | null>(null);

  const [isDeletingGroup, setIsDeletingGroup] = React.useState(false);
  /** @see FR-character-long-rest */
  const [groupPendingLongRest, setGroupPendingLongRest] = React.useState<Group | null>(null);
  const [isRestingGroup, setIsRestingGroup] = React.useState(false);
  const [isDeletingCharacter, setIsDeletingCharacter] = React.useState(false);
  const { characterToExport, requestCharacterPdfExport, closeExportDialog } = useSidebarCharacterPdfExport();

  const openGroupIds = Array.isArray(openGroupId) ? openGroupId : [];

  const existingCharacterNames = React.useMemo(
    () => groups.flatMap((group) => (group.characters ?? []).map((c) => characterDisplayName(c)).filter(Boolean)),
    [groups],
  );

  const existingGroupLabels = React.useMemo(() => groups.map((group) => group.label.trim()).filter(Boolean), [groups]);

  const selectedCharacterId = pathname?.includes("/characters/")
    ? pathname.split("/characters/")[1]?.split("/")[0]?.split("?")[0]
    : null;

  const handleConfirmDeleteGroup = React.useCallback(async () => {
    if (!groupPendingDelete || isDeletingGroup) return;
    try {
      setIsDeletingGroup(true);
      await onDeleteGroup(groupPendingDelete._id);
      setGroupPendingDelete(null);
    } finally {
      setIsDeletingGroup(false);
    }
  }, [groupPendingDelete, isDeletingGroup, onDeleteGroup]);

  React.useEffect(() => {
    if (!characterPendingDelete || isNpcGroupCharacter(characterPendingDelete.character)) {
      setDeleteCompanionsPreview([]);
      setLoadingDeleteCompanions(false);
      return;
    }

    let cancelled = false;
    setLoadingDeleteCompanions(true);
    void CharacterService.getNpcsByLinkedPlayers([characterPendingDelete.character._id])
      .then((npcs) => {
        if (!cancelled) setDeleteCompanionsPreview(npcs);
      })
      .catch(() => {
        if (!cancelled) setDeleteCompanionsPreview([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingDeleteCompanions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [characterPendingDelete]);

  React.useEffect(() => {
    if (!characterToDuplicate || isNpcGroupCharacter(characterToDuplicate.character)) {
      setDuplicateCompanionsPreview([]);
      setLoadingDuplicateCompanions(false);
      return;
    }

    let cancelled = false;
    setLoadingDuplicateCompanions(true);
    void CharacterService.getNpcsByLinkedPlayers([characterToDuplicate.character._id])
      .then((npcs) => {
        if (!cancelled) setDuplicateCompanionsPreview(npcs);
      })
      .catch(() => {
        if (!cancelled) setDuplicateCompanionsPreview([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingDuplicateCompanions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [characterToDuplicate]);

  const isPendingGroupPlayer = characterPendingDelete && !isNpcGroupCharacter(characterPendingDelete.character);

  const showPlayerCompanionDeleteDialog = Boolean(
    isPendingGroupPlayer && (loadingDeleteCompanions || deleteCompanionsPreview.length > 0),
  );

  const navigateAfterGroupCharacterDelete = React.useCallback(
    (deletingCharacterId: string, groupId: string, deleteLinkedCompanions: boolean, companions: NPC[]) => {
      const viewingDeletedSheet =
        selectedCharacterId === deletingCharacterId ||
        (deleteLinkedCompanions && companions.some((npc) => npc._id === selectedCharacterId));
      if (!viewingDeletedSheet || !selectedCampaignId) return;
      const remainingGroup = groups.find((group) => group._id === groupId);
      const nextCharacter = remainingGroup?.characters?.find((item) => item._id !== deletingCharacterId);
      if (nextCharacter?._id) {
        router.replace(`/campaigns/${selectedCampaignId}/groups/${groupId}/characters/${nextCharacter._id}`);
      } else {
        router.replace(`/campaigns/${selectedCampaignId}/groups/${groupId}/characters/new/players`);
      }
    },
    [groups, router, selectedCampaignId, selectedCharacterId],
  );

  const executeGroupCharacterDelete = React.useCallback(
    async (deleteLinkedCompanions: boolean) => {
      if (!characterPendingDelete || isDeletingCharacter || !selectedCampaignId) return;

      const { character, groupId } = characterPendingDelete;
      const deletingCharacterId = character._id;
      const deletingPlayer = !isNpcGroupCharacter(character);

      try {
        setIsDeletingCharacter(true);
        if (deletingPlayer) {
          await deletePlayerCharacterWithCompanionChoice(deletingCharacterId, deleteLinkedCompanions);
          syncReduxAfterPlayerDelete(dispatch, {
            playerId: deletingCharacterId,
            deleteLinkedCompanions,
            companions: deleteCompanionsPreview,
            campaignGroupId: groupId,
          });
        } else {
          await CharacterService.deleteCharacter(deletingCharacterId);
          dispatch(removeCharacterFromGroup({ groupId, characterId: deletingCharacterId }));
        }
        setCharacterPendingDelete(null);
        navigateAfterGroupCharacterDelete(
          deletingCharacterId,
          groupId,
          deleteLinkedCompanions,
          deleteCompanionsPreview,
        );
      } catch (error) {
        console.error("Error deleting character:", error);
      } finally {
        setIsDeletingCharacter(false);
      }
    },
    [
      characterPendingDelete,
      deleteCompanionsPreview,
      dispatch,
      isDeletingCharacter,
      navigateAfterGroupCharacterDelete,
      selectedCampaignId,
    ],
  );

  const handleConfirmDeleteCharacter = React.useCallback(async () => {
    await executeGroupCharacterDelete(false);
  }, [executeGroupCharacterDelete]);

  const pendingDeleteCharacterName = characterPendingDelete
    ? characterDisplayName(characterPendingDelete.character)
    : "";

  const handleDuplicateCharacter = React.useCallback(
    async (
      source: GroupCharacter,
      groupId: string,
      name: string,
      count: number,
      andMove = false,
      companionMode: PlayerDuplicateCompanionMode = "playerOnly",
      companions: NPC[] = [],
    ) => {
      if (!selectedCampaignId) return;
      try {
        const full = await CharacterService.getCharacterById(source._id);
        const isNpc = !("progression" in full);
        const mode = effectiveDuplicateCompanionMode(companionMode, count);

        const createdChars: GroupCharacter[] = [];
        const copyNames = buildSequentialCopyNames(name, count);
        let npcNames = existingCharacterNames;

        for (const copyName of copyNames) {
          let created;
          if (isNpc) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _id, createdBy, deletedAt, groups, ...rest } = full;
            const payload = { ...rest, firstname: copyName, lastname: "", groups: [groupId] };
            created = await CharacterService.createCharacter("npcs", payload as typeof rest);
          } else {
            created = await createPlayerDuplicateFromFull(full, copyName, [groupId]);
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

          dispatch(
            addCharacterToGroup({
              groupId,
              character: {
                _id: created._id,
                firstname: created.firstname,
                lastname: created.lastname,
                surname: created.surname,
              },
            }),
          );

          createdChars.push({
            _id: created._id,
            firstname: created.firstname,
            lastname: created.lastname,
            surname: created.surname,
            userId: source.userId,
          });
        }

        showToast(t("duplicateCharacterSuccess"), "success");

        if (andMove && createdChars.length > 0) {
          setPendingMoveAfterDuplicate({ characters: createdChars, groupId });
        } else if (count === 1 && createdChars.length === 1) {
          router.push(`/campaigns/${selectedCampaignId}/groups/${groupId}/characters/${createdChars[0]._id}`);
          if (isMobile) setOpenMobile(false);
        }
      } catch {
        showToast(t("duplicateCharacterError"), "error");
        throw new Error("duplicate failed");
      }
    },
    [dispatch, existingCharacterNames, isMobile, router, selectedCampaignId, setOpenMobile, t],
  );

  const handleDuplicateGroup = React.useCallback(
    async (source: Group, label: string, count: number) => {
      if (!selectedCampaignId) return;
      try {
        let firstCreatedGroupId: string | null = null;
        let firstCharId: string | null = null;

        const copyLabels = buildSequentialCopyNames(label, count);
        for (let i = 0; i < copyLabels.length; i++) {
          const copyLabel = copyLabels[i];
          const newGroup = await GroupService.createGroup(selectedCampaignId, { label: copyLabel });

          const createdCharacters: GroupCharacter[] = [];
          for (const member of source.characters) {
            const full = await CharacterService.getCharacterById(member._id);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _id, createdBy, deletedAt, groups, ...rest } = full;
            const isNpc = !("progression" in full);
            const type = isNpc ? "npcs" : "players";
            const created = await CharacterService.createCharacter(type, {
              ...rest,
              groups: [newGroup._id],
            } as typeof rest);
            createdCharacters.push({
              _id: created._id,
              firstname: created.firstname,
              lastname: created.lastname,
              surname: created.surname,
              userId: member.userId,
            });
          }

          dispatch(
            addGroupToStore({
              ...newGroup,
              characters: createdCharacters,
            }),
          );

          if (i === 0) {
            firstCreatedGroupId = newGroup._id;
            firstCharId = createdCharacters[0]?._id ?? null;
          }
        }

        showToast(t("duplicateGroupSuccess", { count }), "success");

        if (firstCreatedGroupId) {
          if (firstCharId) {
            router.push(`/campaigns/${selectedCampaignId}/groups/${firstCreatedGroupId}/characters/${firstCharId}`);
          }
          if (isMobile) setOpenMobile(false);
        }
      } catch {
        showToast(t("duplicateGroupError"), "error");
        throw new Error("group duplicate failed");
      }
    },
    [dispatch, isMobile, router, selectedCampaignId, setOpenMobile, t],
  );

  const handleConfirmGroupLongRest = React.useCallback(async () => {
    if (!groupPendingLongRest || isRestingGroup) return;
    const group = groupPendingLongRest;
    setIsRestingGroup(true);
    try {
      const { rested, skipped } = await applyGroupLongRest(
        {
          characterIds: (group.characters ?? []).map((character) => character._id),
          currentUserId,
          sessionCode: isSessionLaunched ? sessionCode : null,
        },
        {
          fetchCharacter: (id, code) =>
            CharacterService.getCharacterById(id, { sessionCode: code }) as Promise<Player | NPC>,
          updateCharacter: (type, id, data, code) => CharacterService.updateCharacter(type, id, data, code),
        },
      );
      // In session the sheet sync bridge already bumps the open sheets (FR-session-combat-sync).
      if (!isSessionLaunched) {
        for (const character of rested) dispatch(touchRemoteCharacterSheet(character._id));
      }
      const message =
        skipped > 0
          ? `${t("longRestGroupSuccess", { count: rested.length })} · ${t("longRestGroupSkipped", { count: skipped })}`
          : t("longRestGroupSuccess", { count: rested.length });
      showToast(message, rested.length === 0 ? "error" : "success");
      setGroupPendingLongRest(null);
    } finally {
      setIsRestingGroup(false);
    }
  }, [currentUserId, dispatch, groupPendingLongRest, isRestingGroup, isSessionLaunched, sessionCode, t]);

  const buildGroupActions = React.useCallback(
    (group: Group): SidebarActionItem[] => {
      const hasCharacters = (group.characters ?? []).length > 0;
      const longRestAction: SidebarActionItem = {
        id: "longRest",
        label: t("longRestGroup"),
        disabled: !hasCharacters,
        onSelect: () => setGroupPendingLongRest(group),
      };

      // FR-sidebar-context-actions exception: in session only the group long rest stays enabled.
      if (actionsDisabled) {
        if (isArchivedSection) return [];
        return [
          longRestAction,
          { id: "edit", label: t("edit"), disabled: true, onSelect: () => undefined },
          { id: "duplicate", label: t("duplicate"), disabled: true, onSelect: () => undefined },
          { id: "archive", label: t("archive"), disabled: true, onSelect: () => undefined },
          { id: "delete", label: t("delete"), variant: "destructive", disabled: true, onSelect: () => undefined },
        ];
      }

      const items: SidebarActionItem[] = [
        {
          id: "edit",
          label: t("edit"),
          onSelect: () => setGroupToEdit(group),
        },
      ];

      if (!isArchivedSection) {
        items.push(longRestAction);
        items.push({
          id: "duplicate",
          label: t("duplicate"),
          onSelect: () => setGroupToDuplicate(group),
        });
      }

      if (isArchivedSection) {
        items.push({
          id: "unarchive",
          label: t("unarchive"),
          onSelect: () => void onUnarchiveGroup(group._id),
        });
      } else {
        items.push({
          id: "archive",
          label: t("archive"),
          onSelect: () => void onArchiveGroup(group._id),
        });
      }

      items.push({
        id: "delete",
        label: t("delete"),
        variant: "destructive",
        onSelect: () => setGroupPendingDelete(group),
      });

      return items;
    },
    [actionsDisabled, isArchivedSection, onArchiveGroup, onUnarchiveGroup, t],
  );

  const handleAddGmGuestToSession = React.useCallback(
    async (character: GroupCharacter) => {
      dispatch(addGmGuestCharacterToSession(character._id));
      if (!battleInitialized) return;
      try {
        const full = await CharacterService.getCharacterById(character._id);
        const row = createInitiativeTrackerRow({
          groupId: SESSION_PARTICIPANTS_GROUP_ID,
          groupLabel: SESSION_PARTICIPANTS_GROUP_LABEL,
          characterId: full._id,
          firstname: full.firstname ?? "",
          lastname: full.lastname ?? "",
          surname: full.surname ?? "",
          avatar: full.avatar ?? "",
          hitPoints: full.stats?.currentHitPoints ?? 0,
          maxHitPoints: full.stats?.maxHitPoints ?? 0,
          tempHitPoints: full.stats?.tempHitPoints ?? 0,
          armorClass: full.stats?.armorClass ?? 10,
          kind: "progression" in full ? "player" : "npc",
          initiativeModifier: full.stats?.initiative ?? 0,
        });
        dispatch(appendInitiativeTrackerRows([{ ...row, isGmGuest: true }]));
      } catch {
        /* tracker add non-bloquant */
      }
    },
    [battleInitialized, dispatch],
  );

  const handleRemoveGmGuestFromSession = React.useCallback(
    (character: GroupCharacter) => {
      dispatch(removeGmGuestCharacterFromSession(character._id));
      if (battleInitialized) {
        dispatch(removeInitiativeTrackerRow(`${SESSION_PARTICIPANTS_GROUP_ID}:${character._id}`));
      }
    },
    [battleInitialized, dispatch],
  );

  const buildCharacterActions = React.useCallback(
    (character: GroupCharacter, groupId: string): SidebarActionItem[] => {
      if (!selectedCampaignId) return [];

      const npcPdfExportDisabled = isNpcGroupCharacter(character);
      const exportAction: SidebarActionItem = {
        id: "exportPdf",
        label: t("exportPdf"),
        disabled: npcPdfExportDisabled,
        disabledTooltip: npcPdfExportDisabled ? t("exportPdfNpcComingSoon") : undefined,
        onSelect: () => {
          if (npcPdfExportDisabled) return;
          void requestCharacterPdfExport(character._id);
        },
      };

      if (actionsDisabled) {
        const isGuest = gmGuestCharacterIds.includes(character._id);
        return [
          exportAction,
          {
            id: isGuest ? "removeFromSession" : "addToSession",
            label: isGuest ? t("removeFromSession") : t("addToSession"),
            onSelect: () =>
              isGuest ? handleRemoveGmGuestFromSession(character) : void handleAddGmGuestToSession(character),
          },
        ];
      }

      const items: SidebarActionItem[] = [exportAction];

      items.push({
        id: "duplicate",
        label: t("duplicate"),
        onSelect: () => setCharacterToDuplicate({ character, groupId }),
      });

      if (
        canMoveCharacterToAnotherGroup({
          activeGroupsTotal,
          activeGroupsHasMore,
          archivedGroupsTotal,
          archivedGroupsHasMore,
          loadedActiveGroupIds,
          loadedArchivedGroupIds,
          currentGroupId: groupId,
        })
      ) {
        items.push({
          id: "move",
          label: t("move"),
          onSelect: () => setCharacterToMove({ character, groupId }),
        });
      }

      items.push(
        {
          id: "edit",
          label: t("edit"),
          onSelect: () => {
            router.push(`/campaigns/${selectedCampaignId}/groups/${groupId}/characters/${character._id}?mode=edit`);
            if (isMobile) setOpenMobile(false);
          },
        },
        {
          id: "delete",
          label: t("delete"),
          variant: "destructive",
          onSelect: () => setCharacterPendingDelete({ character, groupId }),
        },
      );

      return items;
    },
    [
      actionsDisabled,
      activeGroupsHasMore,
      activeGroupsTotal,
      archivedGroupsHasMore,
      archivedGroupsTotal,
      gmGuestCharacterIds,
      handleAddGmGuestToSession,
      handleRemoveGmGuestFromSession,
      isMobile,
      loadedActiveGroupIds,
      loadedArchivedGroupIds,
      requestCharacterPdfExport,
      router,
      selectedCampaignId,
      setOpenMobile,
      t,
    ],
  );

  if (groups.length === 0) {
    return <div className="px-3 py-2 text-sm text-white/40">{t("noGroups")}</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => {
        const isOpen = openGroupIds.includes(group._id);
        const groupActions = buildGroupActions(group);
        const hiddenActiveId = collapsedActiveGroupCharacterId(isOpen, selectedCharacterId, group.characters);
        const hiddenActiveCharacter = hiddenActiveId
          ? group.characters?.find((character) => character._id === hiddenActiveId)
          : undefined;
        const hiddenActiveName = hiddenActiveCharacter ? characterDisplayName(hiddenActiveCharacter) : "";
        const activeTooltip = hiddenActiveName ? t("groupActiveCharacterTooltip", { name: hiddenActiveName }) : null;

        return (
          <Collapsible
            key={group._id}
            open={isOpen}
            onOpenChange={() => onToggleGroup(group._id)}>
            <div
              title={activeTooltip ?? undefined}
              className={cn(
                "flex w-full items-center rounded-[12px] py-1.5 pr-1.5 pl-1 transition-colors duration-100",
                activeTooltip ? "bg-white/15 text-white" : "hover:bg-white/10",
              )}>
              <SidebarItemWithActions
                actions={groupActions}
                disabled={groupActions.length === 0}
                contextMenuLabel={t("groupActions")}
                className="min-w-0 flex-1"
                trailingBeforeOverflow={
                  !isArchivedSection && selectedCampaignId ? (
                    <CreateCharacterDialog
                      campaignId={selectedCampaignId}
                      groupId={group._id}>
                      <button
                        type="button"
                        aria-label={t("createCharacter")}
                        className={cn(
                          "flex shrink-0 cursor-pointer items-center justify-center rounded-[8px] p-1.5 text-white/40 transition-all duration-100",
                          "hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50",
                        )}>
                        <UserPlus
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </button>
                    </CreateCharacterDialog>
                  ) : undefined
                }>
                <CollapsibleTrigger
                  aria-expanded={isOpen}
                  aria-controls={`group-${group._id}-content`}
                  className="flex w-full min-w-0 cursor-pointer items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50">
                  <ChevronRight
                    aria-hidden="true"
                    className={cn("h-4 w-4 shrink-0 transition-all duration-100", isOpen && "rotate-90")}
                  />
                  <span className="min-w-0 flex-1 truncate text-left text-sm font-bold">{group.label}</span>
                  {activeTooltip ? <span className="sr-only">{activeTooltip}</span> : null}
                </CollapsibleTrigger>
              </SidebarItemWithActions>
            </div>

            <CollapsibleContent
              id={`group-${group._id}-content`}
              className="mt-1 ml-4 flex flex-col gap-1">
              {group.characters && group.characters.length > 0 ? (
                group.characters.map((character) => {
                  const isSelected = selectedCharacterId === character._id;
                  const characterActions = buildCharacterActions(character, group._id);
                  const displayName = characterDisplayName(character);

                  return (
                    <SidebarItemWithActions
                      key={character._id}
                      actions={characterActions}
                      disabled={characterActions.length === 0}
                      contextMenuLabel={t("characterActions")}
                      className={cn(
                        "rounded-[12px] transition-all duration-100",
                        isSelected ? "bg-white/15 text-white" : "hover:bg-white/10",
                      )}>
                      <Link
                        href={`/campaigns/${selectedCampaignId}/groups/${group._id}/characters/${character._id}`}
                        aria-current={isSelected ? "page" : undefined}
                        aria-label={`${displayName}${isSelected ? ` (${t("selected")})` : ""}`}
                        title={displayName}
                        className={cn(
                          "relative flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 px-3 text-sm focus-visible:ring-1 focus-visible:ring-white/50",
                          isSelected && "font-bold",
                        )}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                        }}>
                        <SidebarCharacterAvatar
                          characterId={character._id}
                          storedValue={character.avatar}
                          alt={displayName}
                          sessionCode={isInSession ? sessionCode : null}
                          avatarImageUrl={sidebarCharacterAvatarImageUrl(getAvatarUrl, character._id, character.avatar)}
                        />
                        <span className="min-w-0 flex-1 truncate">{displayName}</span>
                      </Link>
                    </SidebarItemWithActions>
                  );
                })
              ) : (
                <div className="px-3 py-1 text-sm text-white/40">{t("noCharacters")}</div>
              )}
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      <ConfirmDialog
        open={!!groupPendingDelete}
        onOpenChange={(open) => {
          if (!open && !isDeletingGroup) setGroupPendingDelete(null);
        }}
        title={t("deleteGroupDialogTitle")}
        description={t("deleteGroupDialogDescription")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={handleConfirmDeleteGroup}
        isLoading={isDeletingGroup}
      />

      <ConfirmDialog
        open={!!groupPendingLongRest}
        onOpenChange={(open) => {
          if (!open && !isRestingGroup) setGroupPendingLongRest(null);
        }}
        title={t("longRestGroupDialogTitle", { group: groupPendingLongRest?.label ?? "" })}
        description={t("longRestGroupDialogDescription", {
          players: (groupPendingLongRest?.characters ?? []).filter((c) => !isNpcGroupCharacter(c)).length,
          npcs: (groupPendingLongRest?.characters ?? []).filter((c) => isNpcGroupCharacter(c)).length,
        })}
        confirmLabel={t("longRestGroupConfirm")}
        cancelLabel={t("cancel")}
        onConfirm={handleConfirmGroupLongRest}
        isLoading={isRestingGroup}
        destructive={false}
      />

      <ConfirmDialog
        open={!!characterPendingDelete && !showPlayerCompanionDeleteDialog}
        onOpenChange={(open) => {
          if (!open && !isDeletingCharacter) setCharacterPendingDelete(null);
        }}
        title={t("deleteCharacterDialogTitle")}
        description={t("deleteCharacterDialogDescription")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={handleConfirmDeleteCharacter}
        isLoading={isDeletingCharacter}
      />

      <LazyDeletePlayerWithCompanionsDialog
        open={showPlayerCompanionDeleteDialog}
        onOpenChange={(open) => {
          if (!open && !isDeletingCharacter) setCharacterPendingDelete(null);
        }}
        playerName={pendingDeleteCharacterName}
        companions={deleteCompanionsPreview}
        isLoading={isDeletingCharacter}
        isLoadingCompanions={loadingDeleteCompanions}
        title={t("deletePlayerWithCompanionsTitle")}
        description={t("deletePlayerWithCompanionsDescription")}
        companionsListLabel={t("deletePlayerWithCompanionsListLabel")}
        cancelLabel={t("cancel")}
        keepCompanionsLabel={t("deletePlayerKeepCompanions")}
        deleteAllLabel={t("deletePlayerAndCompanions", { count: deleteCompanionsPreview.length })}
        keepCompanionsAriaLabel={t("deletePlayerKeepCompanionsAria")}
        deleteAllAriaLabel={t("deletePlayerAndCompanionsAria", {
          count: deleteCompanionsPreview.length,
        })}
        onKeepCompanions={() => executeGroupCharacterDelete(false)}
        onDeleteWithCompanions={() => executeGroupCharacterDelete(true)}
      />

      <EditGroupDialog
        group={groupToEdit}
        open={!!groupToEdit}
        onOpenChange={(open) => {
          if (!open) setGroupToEdit(null);
        }}
        onUpdated={onRefreshGroups}
      />

      <MoveCharacterDialog
        character={characterToMove?.character ?? null}
        campaignId={selectedCampaignId}
        currentGroupId={characterToMove?.groupId ?? ""}
        open={!!characterToMove}
        onOpenChange={(open) => {
          if (!open) setCharacterToMove(null);
        }}
        onMoved={onRefreshGroups}
      />

      <MoveCharacterDialog
        character={pendingMoveAfterDuplicate?.characters[0] ?? null}
        campaignId={selectedCampaignId}
        currentGroupId={pendingMoveAfterDuplicate?.groupId ?? ""}
        open={!!pendingMoveAfterDuplicate}
        onOpenChange={(open) => {
          if (!open) setPendingMoveAfterDuplicate(null);
        }}
        onMovedToGroup={async (targetGroupId) => {
          const pending = pendingMoveAfterDuplicate;
          if (!pending) return;
          await Promise.all(
            pending.characters.slice(1).map((c) => moveCharacterToGroup(c._id, pending.groupId, targetGroupId)),
          );
          for (const c of pending.characters) {
            dispatch(removeCharacterFromGroup({ groupId: pending.groupId, characterId: c._id }));
            dispatch(addCharacterToGroup({ groupId: targetGroupId, character: c }));
          }
          setPendingMoveAfterDuplicate(null);
        }}
      />

      <LazyDuplicateCharacterDialog
        character={characterToDuplicate?.character ?? null}
        open={!!characterToDuplicate}
        onOpenChange={(open) => {
          if (!open) setCharacterToDuplicate(null);
        }}
        existingNames={existingCharacterNames}
        companions={duplicateCompanionsPreview}
        isLoadingCompanions={loadingDuplicateCompanions}
        onDuplicate={(name, count, companionMode) =>
          handleDuplicateCharacter(
            characterToDuplicate!.character,
            characterToDuplicate!.groupId,
            name,
            count,
            false,
            companionMode,
            duplicateCompanionsPreview,
          )
        }
        onDuplicateAndMove={(name, count, companionMode) =>
          handleDuplicateCharacter(
            characterToDuplicate!.character,
            characterToDuplicate!.groupId,
            name,
            count,
            true,
            companionMode,
            duplicateCompanionsPreview,
          )
        }
      />

      <DuplicateGroupDialog
        group={groupToDuplicate}
        open={!!groupToDuplicate}
        onOpenChange={(open) => {
          if (!open) setGroupToDuplicate(null);
        }}
        existingLabels={existingGroupLabels}
        onDuplicate={(label, count) => handleDuplicateGroup(groupToDuplicate!, label, count)}
      />

      <LazyExportCharacterSheetPdfDialog
        character={characterToExport}
        open={!!characterToExport}
        onOpenChange={closeExportDialog}
      />
    </div>
  );
}
