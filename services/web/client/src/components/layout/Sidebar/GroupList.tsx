"use client";

import * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, PlusCircle } from "lucide-react";
import { Group } from "@/types/campaign";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { selectSelectedCampaignId } from "@/store/slices/campaignContextSlice";
import { ContextMenu, ContextMenuTrigger } from "@radix-ui/react-context-menu";
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSidebar } from "@/components/ui/sidebar";
import { CreateCharacterDialog } from "@/components/dialogs/CreateCharacterDialog";

interface GroupListProps {
  groups: Group[];
  openGroupId: string[];
  onToggleGroup: (groupId: string) => void;
  /** True when this list represents archived groups section */
  isArchivedSection: boolean;
  onArchiveGroup: (groupId: string) => Promise<void>;
  onUnarchiveGroup: (groupId: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
}

/**
 * Group list component
 * Displays groups with their characters in collapsible sections
 * Highlights currently selected character
 * Provides context menu for group actions (archive, etc.)
 */
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

  // Extract character ID from current URL path
  const selectedCharacterId = pathname?.includes("/characters/")
    ? pathname.split("/characters/")[1]?.split("/")[0]
    : null;

  if (groups.length === 0) {
    return <div className="text-sm text-gray-400 px-3 py-2">{t("noGroups")}</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => {
        const isOpen = openGroupId.includes(group._id);

        return (
          <Collapsible
            key={group._id}
            open={isOpen}
            onOpenChange={() => onToggleGroup(group._id)}>
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <CollapsibleTrigger
                  aria-expanded={isOpen}
                  aria-controls={`group-${group._id}-content`}
                  className={`w-full bg-card cursor-pointer hover:font-bold py-1.5 px-3 rounded-[12px] transition-all duration-100 flex justify-between items-center focus-visible:border ${isOpen ? "font-bold" : ""}`}>
                  <span className={`text-sm text-left ${isOpen ? "font-bold" : ""}`}>
                    {group.label}
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className={`w-4 h-4 transition-all duration-100 ${isOpen ? "rotate-90" : ""}`}
                  />
                </CollapsibleTrigger>
              </ContextMenuTrigger>
              <ContextMenuContent
                className="w-56 bg-card rounded-[12px] py-1.5 px-1.5 shadow focus-visible:outline-none"
                aria-label={t("groupActions")}>
                {isArchivedSection ? (
                  <ContextMenuItem
                    className="cursor-pointer focus-visible:border rounded-[8px] px-2 py-1.5 text-sm hover:text-primary"
                    onClick={() => onUnarchiveGroup(group._id)}>
                    {t("unarchive")}
                  </ContextMenuItem>
                ) : (
                  <ContextMenuItem
                    className="cursor-pointer focus-visible:border rounded-[8px] px-2 py-1.5 text-sm hover:text-primary"
                    onClick={() => onArchiveGroup(group._id)}>
                    {t("archive")}
                  </ContextMenuItem>
                )}

                <ContextMenuItem
                  className="cursor-pointer focus-visible:border rounded-[8px] px-2 py-1.5 text-sm text-red-500 hover:text-red-600 focus:text-red-600"
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
                      className={`w-full text-xs py-1.5 px-3 rounded-[8px] flex items-center gap-2 hover:bg-card/50 transition-all duration-100 cursor-pointer focus-visible:ring-1 ${isSelected ? "bg-card/50 font-bold" : ""
                        }`}
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}>
                      <span className="block min-w-0 flex-1 truncate">
                        {character.firstname} {character.lastname}
                      </span>
                    </Link>
                  );
                })
              ) : (
                <div className="text-xs text-gray-400 px-3 py-1">{t("noCharacters")}</div>
              )}
              
              {/* Create character button - only for non-archived groups */}
              {!isArchivedSection && selectedCampaignId && (
                <CreateCharacterDialog campaignId={selectedCampaignId} groupId={group._id}>
                  <button
                    type="button"
                    aria-label={t("createCharacter")}
                    className="text-xs py-1.5 px-3 rounded-[8px] flex items-center gap-2 hover:bg-card/50 transition-all duration-100 cursor-pointer focus-visible:ring-1 text-gray-400 hover:text-white"
                  >
                    <PlusCircle className="w-3 h-3" aria-hidden="true" />
                    {t("createCharacter")}
                  </button>
                </CreateCharacterDialog>
              )}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
      {groupPendingDelete && (
        <Dialog
          open={!!groupPendingDelete}
          onOpenChange={(open) => {
            if (!open) setGroupPendingDelete(null);
          }}>
          <DialogContent className="sm:max-w-sm rounded-[15px] bg-card">
            <DialogHeader>
              <DialogTitle>{t("deleteGroupDialogTitle")}</DialogTitle>
              <DialogDescription>{t("deleteGroupDialogDescription")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setGroupPendingDelete(null)}>
                {t("cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="text-black"
                onClick={async () => {
                  if (groupPendingDelete) {
                    await onDeleteGroup(groupPendingDelete._id);
                  }
                  setGroupPendingDelete(null);
                }}>
                {t("delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
