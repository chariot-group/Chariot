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
import { EditGroupDialog } from "@/components/dialogs/EditGroupDialog";
import { MoveCharacterDialog } from "@/components/dialogs/MoveCharacterDialog";
import { DuplicateCharacterDialog } from "@/components/dialogs/DuplicateCharacterDialog";
import { DuplicateGroupDialog } from "@/components/dialogs/DuplicateGroupDialog";
import type { SidebarActionItem } from "@/components/layout/Sidebar/shared/sidebarActions.types";
import CharacterService from "@/services/CharacterService";
import GroupService from "@/services/GroupService";
import { moveCharacterToGroup } from "@/lib/moveCharacterToGroup";
import { showToast } from "@/lib/toast";
import { canMoveCharacterToAnotherGroup } from "@/lib/canMoveCharacterToAnotherGroup";
import { selectIsInSession, selectSessionStatus } from "@/store/slices/sessionSlice";

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
  const sessionStatus = useAppSelector(selectSessionStatus);
  const actionsDisabled = isInSession && sessionStatus === "launched";

  const [groupPendingDelete, setGroupPendingDelete] = React.useState<Group | null>(null);
  const [groupToEdit, setGroupToEdit] = React.useState<Group | null>(null);
  const [characterPendingDelete, setCharacterPendingDelete] = React.useState<{
    character: GroupCharacter;
    groupId: string;
  } | null>(null);
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
  const [isDeletingCharacter, setIsDeletingCharacter] = React.useState(false);

  const openGroupIds = Array.isArray(openGroupId) ? openGroupId : [];

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

  const handleConfirmDeleteCharacter = React.useCallback(async () => {
    if (!characterPendingDelete || isDeletingCharacter || !selectedCampaignId) return;

    const { character, groupId } = characterPendingDelete;
    const deletingCharacterId = character._id;

    try {
      setIsDeletingCharacter(true);
      await CharacterService.deleteCharacter(deletingCharacterId);
      setCharacterPendingDelete(null);
      dispatch(removeCharacterFromGroup({ groupId, characterId: deletingCharacterId }));

      if (selectedCharacterId === deletingCharacterId) {
        const remainingGroup = groups.find((group) => group._id === groupId);
        const nextCharacter = remainingGroup?.characters?.find((item) => item._id !== deletingCharacterId);
        if (nextCharacter?._id) {
          router.replace(`/campaigns/${selectedCampaignId}/groups/${groupId}/characters/${nextCharacter._id}`);
        } else {
          router.replace(`/campaigns/${selectedCampaignId}/groups/${groupId}/characters/new/players`);
        }
      }
    } catch (error) {
      console.error("Error deleting character:", error);
    } finally {
      setIsDeletingCharacter(false);
    }
  }, [
    characterPendingDelete,
    dispatch,
    groups,
    isDeletingCharacter,
    router,
    selectedCampaignId,
    selectedCharacterId,
  ]);

  const handleDuplicateCharacter = React.useCallback(
    async (
      source: GroupCharacter,
      groupId: string,
      name: string,
      count: number,
      andMove = false,
    ) => {
      if (!selectedCampaignId) return;
      try {
        const full = await CharacterService.getCharacterById(source._id);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, createdBy, deletedAt, groups, ...rest } = full;
        const isNpc = !("progression" in full);
        const type = isNpc ? "npcs" : "players";

        const createdChars: GroupCharacter[] = [];
        for (let i = 0; i < count; i++) {
          const copyName = i === 0 ? name : `${name} ${i + 1}`;
          const payload = { ...rest, firstname: copyName, lastname: "", groups: [groupId] };
          const created = await CharacterService.createCharacter(type, payload as typeof rest);

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
    [dispatch, isMobile, router, selectedCampaignId, setOpenMobile, t],
  );

  const handleDuplicateGroup = React.useCallback(
    async (source: Group, label: string, count: number) => {
      if (!selectedCampaignId) return;
      try {
        let firstCreatedGroupId: string | null = null;
        let firstCharId: string | null = null;

        for (let i = 0; i < count; i++) {
          const copyLabel = i === 0 ? label : `${label} ${i + 1}`;
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
            router.push(
              `/campaigns/${selectedCampaignId}/groups/${firstCreatedGroupId}/characters/${firstCharId}`,
            );
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

  const buildGroupActions = React.useCallback(
    (group: Group): SidebarActionItem[] => {
      if (actionsDisabled) return [];

      const items: SidebarActionItem[] = [
        {
          id: "edit",
          label: t("edit"),
          onSelect: () => setGroupToEdit(group),
        },
      ];

      if (!isArchivedSection) {
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

  const buildCharacterActions = React.useCallback(
    (character: GroupCharacter, groupId: string): SidebarActionItem[] => {
      if (actionsDisabled || !selectedCampaignId) return [];

      const items: SidebarActionItem[] = [];

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
    [actionsDisabled, activeGroupsHasMore, activeGroupsTotal, archivedGroupsHasMore, archivedGroupsTotal, isMobile, loadedActiveGroupIds, loadedArchivedGroupIds, router, selectedCampaignId, setOpenMobile, t],
  );

  if (groups.length === 0) {
    return <div className="px-3 py-2 text-sm text-white/40">{t("noGroups")}</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => {
        const isOpen = openGroupIds.includes(group._id);
        const groupActions = buildGroupActions(group);

        return (
          <Collapsible
            key={group._id}
            open={isOpen}
            onOpenChange={() => onToggleGroup(group._id)}>
            <div className="flex w-full items-center rounded-[12px] bg-card py-2 px-1.5 pl-3">
              <SidebarItemWithActions
                actions={groupActions}
                disabled={actionsDisabled}
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
                  <span className={cn("min-w-0 flex-1 truncate text-sm text-left", isOpen && "font-bold")}>
                    {group.label}
                  </span>
                </CollapsibleTrigger>
              </SidebarItemWithActions>
            </div>

            <CollapsibleContent
              id={`group-${group._id}-content`}
              className="mt-1 ml-3 flex flex-col gap-1">
              {group.characters && group.characters.length > 0 ? (
                group.characters.map((character) => {
                  const isSelected = selectedCharacterId === character._id;
                  const characterActions = buildCharacterActions(character, group._id);

                  return (
                    <SidebarItemWithActions
                      key={character._id}
                      actions={characterActions}
                      disabled={actionsDisabled}
                      contextMenuLabel={t("characterActions")}
                      className={cn(
                        "rounded-[12px] transition-all duration-100",
                        isSelected ? "bg-white text-black" : "hover:bg-white/10",
                      )}
                      overflowTriggerClassName={
                        isSelected ? "text-black/40 hover:bg-black/10 hover:text-black" : undefined
                      }>
                      <Link
                        href={`/campaigns/${selectedCampaignId}/groups/${group._id}/characters/${character._id}`}
                        aria-current={isSelected ? "page" : undefined}
                        aria-label={`${character.firstname} ${character.lastname}${isSelected ? ` (${t("selected")})` : ""}`}
                        title={`${character.firstname} ${character.lastname}`}
                        className={cn(
                          "relative flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 px-3 text-sm focus-visible:ring-1 focus-visible:ring-white/50",
                          isSelected && "pl-4 font-bold text-black",
                        )}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                        }}>
                        {isSelected && (
                          <span
                            className="absolute left-1.5 top-2 bottom-2 w-[3px] rounded-full bg-primary"
                            aria-hidden="true"
                          />
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          {character.firstname} {character.lastname}
                        </span>
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
        open={!!characterPendingDelete}
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
            pending.characters.slice(1).map((c) =>
              moveCharacterToGroup(c._id, pending.groupId, targetGroupId),
            ),
          );
          for (const c of pending.characters) {
            dispatch(removeCharacterFromGroup({ groupId: pending.groupId, characterId: c._id }));
            dispatch(addCharacterToGroup({ groupId: targetGroupId, character: c }));
          }
          setPendingMoveAfterDuplicate(null);
        }}
      />

      <DuplicateCharacterDialog
        character={characterToDuplicate?.character ?? null}
        open={!!characterToDuplicate}
        onOpenChange={(open) => {
          if (!open) setCharacterToDuplicate(null);
        }}
        onDuplicate={(name, count) =>
          handleDuplicateCharacter(characterToDuplicate!.character, characterToDuplicate!.groupId, name, count, false)
        }
        onDuplicateAndMove={(name, count) =>
          handleDuplicateCharacter(characterToDuplicate!.character, characterToDuplicate!.groupId, name, count, true)
        }
      />

      <DuplicateGroupDialog
        group={groupToDuplicate}
        open={!!groupToDuplicate}
        onOpenChange={(open) => {
          if (!open) setGroupToDuplicate(null);
        }}
        onDuplicate={(label, count) => handleDuplicateGroup(groupToDuplicate!, label, count)}
      />
    </div>
  );
}
