"use client";

import { useTranslations } from "next-intl";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectContextMode } from "@/store/slices/environmentSlice";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, Layers2, PlusCircleIcon, Loader2, Archive } from "lucide-react";
import { useEffect } from "react";
import { useGroups } from "@/hooks/useGroups";
import GroupList from "@/components/layout/Sidebar/GroupList";
import { selectSelectedCampaign } from "@/store/slices/campaignSlice";
import {
  selectOpenActiveGroups,
  selectOpenArchivedGroups,
  setOpenActiveGroups,
  setOpenArchivedGroups,
} from "@/store/slices/sidebarSlice";
import { selectGroupToOpen, setGroupToOpen } from "@/store/slices/campaignContextSlice";
import { setOpenGroup } from "@/store/slices/groupSlice";
import CharactersWithoutGroupList from "@/components/layout/Sidebar/CharactersWithoutGroupList";
import { CreateGroupDialog } from "@/components/dialogs/CreateGroupDialog";
import GmSessionPlayersSidebarSection from "@/components/layout/Sidebar/GmSessionPlayersSidebarSection";

/**
 * Context navigation component for GM mode
 * Displays active groups and archived groups
 * Only visible in GM mode when a campaign is selected
 */
export default function SidebarContext() {
  const t = useTranslations("sidebar");
  const dispatch = useAppDispatch();
  const contextMode = useAppSelector(selectContextMode);
  const selectedCampaign = useAppSelector(selectSelectedCampaign);
  const openActive = useAppSelector(selectOpenActiveGroups);
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

  // Handle collapsible state changes
  const handleOpenActive = (isOpen: boolean) => {
    dispatch(setOpenActiveGroups(isOpen));
  };

  const handleOpenArchived = (isOpen: boolean) => {
    dispatch(setOpenArchivedGroups(isOpen));
  };

  // Auto-open group when groups are loaded
  useEffect(() => {
    if (!loading && groupToOpen && !openGroupId.includes(groupToOpen)) {
      dispatch(setOpenGroup(groupToOpen));
      dispatch(setGroupToOpen(null)); // Clear the flag after opening
    }
  }, [loading, groupToOpen, openGroupId, dispatch]);

  // Only render in GM mode
  if (contextMode !== "gm") {
    return <CharactersWithoutGroupList />;
  }

  return (
    <nav
      className="flex gap-3 flex-col overflow-y-auto px-3 py-4"
      aria-label={t("gmNavigation")}>
      {/* Selected campaign name */}
      {selectedCampaign && <h2 className="text-lg text-white">{selectedCampaign.label}</h2>}

      <GmSessionPlayersSidebarSection />

      {/* Active groups section */}
      <Collapsible
        className="rounded-[15px] border-2"
        open={openActive}
        onOpenChange={handleOpenActive}>
        <CollapsibleTrigger
          aria-expanded={openActive}
          aria-controls="active-groups-content"
          className={`w-full cursor-pointer hover:bg-white py-1.5 px-3 rounded-[12px] transition-all duration-150 flex justify-between items-center gap-2 group/context focus-visible:border ${openActive ? "bg-white" : ""}`}>
          <span className="flex min-w-0 items-center gap-2">
            <Layers2
              aria-hidden="true"
              className={`h-4 w-4 shrink-0 transition-colors group-hover/context:text-black ${openActive ? "text-black" : ""}`}
            />
            <span
              className={`text-sm truncate group-hover/context:text-black ${openActive ? "text-black font-bold" : ""}`}>
              {t("yourGroups")}
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className={`w-5 h-5 group-hover/context:text-black transition-all duration-100 ${openActive ? "rotate-90 text-black" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent
          id="active-groups-content"
          className="my-2 flex mx-5 flex-col gap-2">
          {/* Create group dialog */}
          <CreateGroupDialog
            onCreateGroup={createGroup}
            onRefreshGroups={refreshGroups}>
            <button
              type="button"
              aria-label={t("createGroup")}
              className="sidebar-btn-white text-sm cursor-pointer flex justify-between transition-all duration-100 text-black border bg-white rounded-[12px] py-1.5 px-3 w-full focus-visible:border">
              {t("createGroup")}
              <PlusCircleIcon
                aria-hidden="true"
                className="w-5 h-5"
              />
            </button>
          </CreateGroupDialog>

          {loading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            </div>
          ) : (
            <div className="mt-1 flex min-h-0 w-full max-h-52 flex-col overflow-y-auto overflow-x-hidden gap-2 overscroll-contain py-0.5 pr-0.5">
              <GroupList
                groups={activeGroups}
                openGroupId={openGroupId}
                onToggleGroup={toggleGroup}
                isArchivedSection={false}
                onArchiveGroup={archiveGroup}
                onUnarchiveGroup={unarchiveGroup}
                onDeleteGroup={deleteGroup}
              />

              {hasMoreActive && (
                <button
                  type="button"
                  key="active-groups-load-more"
                  onClick={() => void loadMoreActiveGroups()}
                  disabled={loadingMoreActive}
                  aria-busy={loadingMoreActive}
                  aria-label={t("loadMoreGroupsAria")}
                  className="text-xs shrink-0 cursor-pointer rounded-[12px] py-1.5 px-3 text-white/90 text-center transition-all duration-100 w-full border border-white/25 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed focus-visible:border">
                  {loadingMoreActive ? (
                    <Loader2
                      className="w-4 h-4 animate-spin mx-auto"
                      aria-hidden
                    />
                  ) : (
                    t("loadMoreGroups")
                  )}
                </button>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Archived groups section */}
      <Collapsible
        className="rounded-[15px] border-2"
        open={openArchived}
        onOpenChange={handleOpenArchived}>
        <CollapsibleTrigger
          aria-expanded={openArchived}
          aria-controls="archived-groups-content"
          className={`w-full cursor-pointer hover:bg-white py-1.5 px-3 rounded-[12px] transition-all duration-150 flex justify-between items-center group/context focus-visible:border ${openArchived ? "bg-white" : ""}`}>
          <span className="flex min-w-0 items-center gap-2">
            <Archive
              aria-hidden="true"
              className={`h-4 w-4 shrink-0 transition-colors group-hover/context:text-black ${openArchived ? "text-black" : ""}`}
            />
            <span className={`text-sm group-hover/context:text-black ${openArchived ? "text-black font-bold" : ""}`}>
              {t("yourArchives")}
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className={`w-5 h-5 group-hover/context:text-black transition-all duration-100 ${openArchived ? "rotate-90 text-black" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent
          id="archived-groups-content"
          className="my-2 flex mx-5 flex-col gap-2">
          {loading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            </div>
          ) : archivedGroups.length === 0 ? (
            <div className="text-sm text-gray-400 px-3 py-2">
              {t("noArchives")}
              <br />
              {t("rightClickToAdd")}
            </div>
          ) : (
            <div className="mt-1 flex min-h-0 w-full max-h-52 flex-col overflow-y-auto overflow-x-hidden gap-2 overscroll-contain py-0.5 pr-0.5">
              <GroupList
                groups={archivedGroups}
                openGroupId={openGroupId}
                onToggleGroup={toggleGroup}
                isArchivedSection={true}
                onArchiveGroup={archiveGroup}
                onUnarchiveGroup={unarchiveGroup}
                onDeleteGroup={deleteGroup}
              />

              {hasMoreArchived && (
                <button
                  type="button"
                  key="archived-groups-load-more"
                  onClick={() => void loadMoreArchivedGroups()}
                  disabled={loadingMoreArchived}
                  aria-busy={loadingMoreArchived}
                  aria-label={t("loadMoreGroupsAria")}
                  className="text-xs shrink-0 cursor-pointer rounded-[12px] py-1.5 px-3 text-white/90 text-center transition-all duration-100 w-full border border-white/25 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed focus-visible:border">
                  {loadingMoreArchived ? (
                    <Loader2
                      className="w-4 h-4 animate-spin mx-auto"
                      aria-hidden
                    />
                  ) : (
                    t("loadMoreGroups")
                  )}
                </button>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </nav>
  );
}
