"use client";

import * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, UserPlus } from "lucide-react";
import { Character as GroupCharacter, Group } from "@/types/campaign";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { selectSelectedCampaignId } from "@/store/slices/campaignContextSlice";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSidebar } from "@/components/ui/sidebar";
import { CreateCharacterDialog } from "@/components/dialogs/CreateCharacterDialog";
import { cn } from "@/lib/utils";
import { SidebarItemWithActions } from "@/components/layout/Sidebar/shared/SidebarItemWithActions";
import { ConfirmDialog } from "@/components/layout/Sidebar/shared/ConfirmDialog";
import { EditGroupDialog } from "@/components/dialogs/EditGroupDialog";
import { MoveCharacterDialog } from "@/components/dialogs/MoveCharacterDialog";
import type { SidebarActionItem } from "@/components/layout/Sidebar/shared/sidebarActions.types";
import CharacterService from "@/services/CharacterService";
import { selectIsInSession, selectSessionStatus } from "@/store/slices/sessionSlice";

interface GroupListProps {
  groups: Group[];
  openGroupId: string[] | null | undefined;
  onToggleGroup: (groupId: string) => void;
  isArchivedSection: boolean;
  onArchiveGroup: (groupId: string) => Promise<void>;
  onUnarchiveGroup: (groupId: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  activeGroupsForMove: Group[];
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
  activeGroupsForMove,
  onRefreshGroups,
}: GroupListProps) {
  const t = useTranslations("sidebar");
  const router = useRouter();
  const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const isInSession = useAppSelector(selectIsInSession);
  const sessionStatus = useAppSelector(selectSessionStatus);
  const actionsDisabled = isInSession && sessionStatus === "launched";

  const [openRowId, setOpenRowId] = React.useState<string | null>(null);
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
      await onRefreshGroups();

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
    groups,
    isDeletingCharacter,
    onRefreshGroups,
    router,
    selectedCampaignId,
    selectedCharacterId,
  ]);

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

      if (activeGroupsForMove.some((group) => group._id !== groupId)) {
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
    [actionsDisabled, activeGroupsForMove, isMobile, router, selectedCampaignId, setOpenMobile, t],
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
            <div className="flex w-full items-center gap-1 rounded-[12px] bg-card py-2 px-1.5 pl-3">
              <SidebarItemWithActions
                rowId={`group-${group._id}`}
                actions={groupActions}
                disabled={actionsDisabled}
                openRowId={openRowId}
                onOpenRowIdChange={setOpenRowId}
                contextMenuLabel={t("groupActions")}
                className="min-w-0 flex-1">
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

              {!isArchivedSection && selectedCampaignId && (
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
              )}
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
                      rowId={`character-${character._id}`}
                      actions={characterActions}
                      disabled={actionsDisabled}
                      openRowId={openRowId}
                      onOpenRowIdChange={setOpenRowId}
                      contextMenuLabel={t("characterActions")}>
                      <Link
                        href={`/campaigns/${selectedCampaignId}/groups/${group._id}/characters/${character._id}`}
                        aria-current={isSelected ? "page" : undefined}
                        aria-label={`${character.firstname} ${character.lastname}${isSelected ? ` (${t("selected")})` : ""}`}
                        title={`${character.firstname} ${character.lastname}`}
                        className={cn(
                          "relative flex w-full cursor-pointer items-center gap-2 rounded-[12px] py-2 px-3 text-sm transition-all duration-100 focus-visible:ring-1 focus-visible:ring-white/50",
                          isSelected ? "bg-white pl-4 font-bold text-black" : "hover:bg-white/10",
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
        currentGroupId={characterToMove?.groupId ?? ""}
        targetGroups={activeGroupsForMove}
        open={!!characterToMove}
        onOpenChange={(open) => {
          if (!open) setCharacterToMove(null);
        }}
        onMoved={onRefreshGroups}
      />
    </div>
  );
}
