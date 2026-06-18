"use client";

import { useTranslations } from "next-intl";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectContextMode } from "@/store/slices/environmentSlice";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, Archive, Loader2, LayersPlus } from "lucide-react";
import { useEffect } from "react";
import { useGroups } from "@/hooks/useGroups";
import GroupList from "@/components/layout/Sidebar/GroupList";
import { selectSelectedCampaign } from "@/store/slices/campaignSlice";
import { selectOpenArchivedGroups, setOpenArchivedGroups } from "@/store/slices/sidebarSlice";
import { selectGroupToOpen, setGroupToOpen } from "@/store/slices/campaignContextSlice";
import { setOpenGroup } from "@/store/slices/groupSlice";
import CharactersWithoutGroupList from "@/components/layout/Sidebar/CharactersWithoutGroupList";
import { CreateGroupDialog } from "@/components/dialogs/CreateGroupDialog";
import GmSessionPlayersSidebarSection from "@/components/layout/Sidebar/GmSessionPlayersSidebarSection";
import { cn } from "@/lib/utils";

export default function SidebarContext() {
  const t = useTranslations("sidebar");
  const dispatch = useAppDispatch();
  const contextMode = useAppSelector(selectContextMode);
  const selectedCampaign = useAppSelector(selectSelectedCampaign);
  const openArchived = useAppSelector(selectOpenArchivedGroups);
  const groupToOpen = useAppSelector(selectGroupToOpen);
  const {
    activeGroups,
    archivedGroups,
    loading,
    loadingMoreActive,
    loadingMoreArchived,
    hasMoreActive,
    hasMoreArchived,
    openGroupId,
    toggleGroup,
    createGroup,
    refreshGroups,
    loadMoreActiveGroups,
    loadMoreArchivedGroups,
    archiveGroup,
    unarchiveGroup,
    deleteGroup,
  } = useGroups();

  const handleOpenArchived = (isOpen: boolean) => {
    dispatch(setOpenArchivedGroups(isOpen));
  };

  useEffect(() => {
    if (!loading && groupToOpen && !openGroupId.includes(groupToOpen)) {
      dispatch(setOpenGroup(groupToOpen));
      dispatch(setGroupToOpen(null));
    }
  }, [loading, groupToOpen, openGroupId, dispatch]);

  if (contextMode !== "gm") {
    return <CharactersWithoutGroupList />;
  }

  return (
    <nav
      className="flex flex-col gap-3 px-3 py-4 overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full"
      aria-label={t("gmNavigation")}>
      {selectedCampaign && <h2 className="shrink-0 text-lg text-white">{selectedCampaign.label}</h2>}

      {/* ── Active groups — shown directly, no collapsible wrapper ── */}
      <CreateGroupDialog
        onCreateGroup={createGroup}
        onRefreshGroups={refreshGroups}>
        <button
          type="button"
          aria-label={t("createGroup")}
          className="sidebar-btn-white flex w-full cursor-pointer items-center justify-between rounded-[12px] border bg-white px-3 py-1.5 text-left text-sm text-black transition-all duration-100 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black focus-visible:ring-offset-2">
          {t("createGroup")}
          <LayersPlus
            className="h-4 w-4 shrink-0"
            aria-hidden="true"
          />
        </button>
      </CreateGroupDialog>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2
            className="h-5 w-5 animate-spin text-white/50"
            aria-hidden
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <GmSessionPlayersSidebarSection />

            <GroupList
              groups={activeGroups}
              openGroupId={openGroupId}
              onToggleGroup={toggleGroup}
              isArchivedSection={false}
              onArchiveGroup={archiveGroup}
              onUnarchiveGroup={unarchiveGroup}
              onDeleteGroup={deleteGroup}
              activeGroupsForMove={activeGroups}
              onRefreshGroups={refreshGroups}
            />

            {hasMoreActive && (
              <button
                type="button"
                onClick={() => void loadMoreActiveGroups()}
                disabled={loadingMoreActive}
                aria-busy={loadingMoreActive}
                aria-label={t("loadMoreGroupsAria")}
                className="w-full shrink-0 cursor-pointer rounded-[12px] border border-white/25 px-3 py-1.5 text-center text-xs text-white/90 transition-all duration-100 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border">
                {loadingMoreActive ? (
                  <Loader2
                    className="mx-auto h-4 w-4 animate-spin"
                    aria-hidden
                  />
                ) : (
                  t("loadMoreGroups")
                )}
              </button>
            )}
          </div>

          {/* ── Archives — collapsible section header ── */}
          <Collapsible
            open={openArchived}
            onOpenChange={handleOpenArchived}>
            <CollapsibleTrigger
              aria-expanded={openArchived}
              aria-controls="archived-groups-content"
              className={cn(
                "group/arc flex w-full cursor-pointer items-center gap-2 rounded-[12px] px-3 py-1.5 transition-all duration-150",
                "hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50",
              )}>
              <Archive
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-white/50 transition-colors group-hover/arc:text-white"
              />
              <span className="text-sm text-white/50 group-hover/arc:text-white">{t("yourArchives")}</span>
              <ChevronRight
                aria-hidden="true"
                className={cn(
                  "ml-auto h-4 w-4 text-white/40 transition-all duration-100 group-hover/arc:text-white",
                  openArchived && "rotate-90",
                )}
              />
            </CollapsibleTrigger>

            <CollapsibleContent
              id="archived-groups-content"
              className="mt-1 flex flex-col gap-2">
              {archivedGroups.length === 0 ? (
                <div className="px-3 py-2 text-sm text-white/40">{t("noArchives")}</div>
              ) : (
                <>
                  <GroupList
                    groups={archivedGroups}
                    openGroupId={openGroupId}
                    onToggleGroup={toggleGroup}
                    isArchivedSection={true}
                    onArchiveGroup={archiveGroup}
                    onUnarchiveGroup={unarchiveGroup}
                    onDeleteGroup={deleteGroup}
                    activeGroupsForMove={activeGroups}
                    onRefreshGroups={refreshGroups}
                  />

                  {hasMoreArchived && (
                    <button
                      type="button"
                      onClick={() => void loadMoreArchivedGroups()}
                      disabled={loadingMoreArchived}
                      aria-busy={loadingMoreArchived}
                      aria-label={t("loadMoreGroupsAria")}
                      className="w-full shrink-0 cursor-pointer rounded-[12px] border border-white/25 px-3 py-1.5 text-center text-xs text-white/90 transition-all duration-100 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none">
                      {loadingMoreArchived ? (
                        <Loader2
                          className="mx-auto h-4 w-4 animate-spin"
                          aria-hidden
                        />
                      ) : (
                        t("loadMoreGroups")
                      )}
                    </button>
                  )}
                </>
              )}
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </nav>
  );
}
