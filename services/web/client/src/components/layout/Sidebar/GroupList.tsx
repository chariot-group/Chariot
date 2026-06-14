"use client";

import * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, UserPlus } from "lucide-react";
import { Group } from "@/types/campaign";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { selectSelectedCampaignId } from "@/store/slices/campaignContextSlice";
import { ContextMenu, ContextMenuTrigger } from "@radix-ui/react-context-menu";
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSidebar } from "@/components/ui/sidebar";
import { CreateCharacterDialog } from "@/components/dialogs/CreateCharacterDialog";
import { cn } from "@/lib/utils";

interface GroupListProps {
  groups: Group[];
  openGroupId: string[] | null | undefined;
  onToggleGroup: (groupId: string) => void;
  /** True when this list represents archived groups section */
  isArchivedSection: boolean;
  onArchiveGroup: (groupId: string) => Promise<void>;
  onUnarchiveGroup: (groupId: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
}

export default function GroupList({
  groups,
  openGroupId,
  onToggleGroup,
  isArchivedSection,
  onArchiveGroup,
  onUnarchiveGroup,
  onDeleteGroup,
}: GroupListProps) {
  const t = useTranslations("sidebar");
  const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const [groupPendingDelete, setGroupPendingDelete] = React.useState<Group | null>(null);
  const openGroupIds = Array.isArray(openGroupId) ? openGroupId : [];
  const [isDeletingGroup, setIsDeletingGroup] = React.useState(false);

  const handleConfirmDelete = React.useCallback(async () => {
    if (!groupPendingDelete || isDeletingGroup) return;
    try {
      setIsDeletingGroup(true);
      await onDeleteGroup(groupPendingDelete._id);
      setGroupPendingDelete(null);
    } finally {
      setIsDeletingGroup(false);
    }
  }, [groupPendingDelete, isDeletingGroup, onDeleteGroup]);

  const selectedCharacterId = pathname?.includes("/characters/")
    ? pathname.split("/characters/")[1]?.split("/")[0]
    : null;

  if (groups.length === 0) {
    return <div className="px-3 py-2 text-sm text-white/40">{t("noGroups")}</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => {
        const isOpen = openGroupIds.includes(group._id);

        return (
          <Collapsible
            key={group._id}
            open={isOpen}
            onOpenChange={() => onToggleGroup(group._id)}>
            <ContextMenu>
              <ContextMenuTrigger asChild>
                {/* Group header: trigger + optional user+ button as siblings in a wrapper */}
                <div className="flex w-full items-center gap-1 rounded-[12px] bg-card py-2 px-1.5 pl-3">
                  <CollapsibleTrigger
                    aria-expanded={isOpen}
                    aria-controls={`group-${group._id}-content`}
                    className="flex flex-1 min-w-0 cursor-pointer items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50">
                    <ChevronRight
                      aria-hidden="true"
                      className={cn(
                        "h-4 w-4 shrink-0 transition-all duration-100",
                        isOpen && "rotate-90",
                      )}
                    />
                    <span className={cn("min-w-0 flex-1 truncate text-sm text-left", isOpen && "font-bold")}>
                      {group.label}
                    </span>
                  </CollapsibleTrigger>

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
              </ContextMenuTrigger>

              <ContextMenuContent
                className="w-56 rounded-[12px] bg-card px-1.5 py-1.5 shadow focus-visible:outline-none"
                aria-label={t("groupActions")}>
                {isArchivedSection ? (
                  <ContextMenuItem
                    className="cursor-pointer rounded-[8px] px-2 py-1.5 text-sm hover:text-primary focus-visible:border"
                    onClick={() => onUnarchiveGroup(group._id)}>
                    {t("unarchive")}
                  </ContextMenuItem>
                ) : (
                  <ContextMenuItem
                    className="cursor-pointer rounded-[8px] px-2 py-1.5 text-sm hover:text-primary focus-visible:border"
                    onClick={() => onArchiveGroup(group._id)}>
                    {t("archive")}
                  </ContextMenuItem>
                )}
                <ContextMenuItem
                  className="cursor-pointer rounded-[8px] px-2 py-1.5 text-sm text-red-500 hover:text-red-600 focus:text-red-600 focus-visible:border"
                  onClick={() => setGroupPendingDelete(group)}>
                  {t("delete")}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>

            <CollapsibleContent
              id={`group-${group._id}-content`}
              className="mt-1 ml-3 flex flex-col gap-1">
              {group.characters && group.characters.length > 0 ? (
                group.characters.map((character) => {
                  const isSelected = selectedCharacterId === character._id;
                  return (
                    <Link
                      href={`/campaigns/${selectedCampaignId}/groups/${group._id}/characters/${character._id}`}
                      key={character._id}
                      aria-current={isSelected ? "page" : undefined}
                      aria-label={`${character.firstname} ${character.lastname}${isSelected ? ` (${t("selected")})` : ""}`}
                      title={`${character.firstname} ${character.lastname}`}
                      className={cn(
                        "relative flex w-full cursor-pointer items-center gap-2 rounded-[12px] py-2 px-3 text-sm transition-all duration-100 focus-visible:ring-1 focus-visible:ring-white/50",
                        isSelected
                          ? "bg-white pl-4 font-bold text-black"
                          : "hover:bg-white/10",
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
                  );
                })
              ) : (
                <div className="px-3 py-1 text-sm text-white/40">{t("noCharacters")}</div>
              )}
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      {groupPendingDelete && (
        <Dialog
          open={!!groupPendingDelete}
          onOpenChange={(open) => {
            if (!open && !isDeletingGroup) setGroupPendingDelete(null);
          }}>
          <DialogContent
            className="rounded-[15px] bg-card sm:max-w-sm"
            onEscapeKeyDown={() => {
              if (!isDeletingGroup) setGroupPendingDelete(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleConfirmDelete();
              }
            }}>
            <DialogHeader>
              <DialogTitle>{t("deleteGroupDialogTitle")}</DialogTitle>
              <DialogDescription>{t("deleteGroupDialogDescription")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                disabled={isDeletingGroup}
                type="button"
                variant="outline"
                onClick={() => setGroupPendingDelete(null)}>
                {t("cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="text-black"
                disabled={isDeletingGroup}
                onClick={() => void handleConfirmDelete()}>
                {t("delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
