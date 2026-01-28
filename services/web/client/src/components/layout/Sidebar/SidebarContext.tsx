"use client";

import { useTranslations } from "next-intl";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectContextMode } from "@/store/slices/environmentSlice";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, PlusCircleIcon, Loader2 } from "lucide-react";
import { useGroups } from "@/hooks/useGroups";
import GroupList from "./GroupList";
import { selectSelectedCampaign } from "@/store/slices/campaignSlice";
import {
  selectOpenActiveGroups,
  selectOpenArchivedGroups,
  setOpenActiveGroups,
  setOpenArchivedGroups,
} from "@/store/slices/sidebarSlice";
import CharactersWithoutGroupList from "@/components/layout/Sidebar/CharactersWithoutGroupList";

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
  const { activeGroups, archivedGroups, loading, openGroupId, toggleGroup } = useGroups();

  // Handle collapsible state changes
  const handleOpenActive = (isOpen: boolean) => {
    dispatch(setOpenActiveGroups(isOpen));
  };

  const handleOpenArchived = (isOpen: boolean) => {
    dispatch(setOpenArchivedGroups(isOpen));
  };

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

      {/* Active groups section */}
      <Collapsible
        className="rounded-[15px] border-2"
        open={openActive}
        onOpenChange={handleOpenActive}>
        <CollapsibleTrigger
          aria-expanded={openActive}
          aria-controls="active-groups-content"
          className={`w-full cursor-pointer hover:bg-white py-1.5 px-3 rounded-[12px] transition-all duration-150 flex justify-between items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 ${openActive ? "bg-white" : ""}`}>
          <span
            className={`text-sm group-hover:font-bold group-hover:text-black ${openActive ? "text-black font-bold" : ""}`}>
            {t("yourGroups")}
          </span>
          <ChevronRight
            aria-hidden="true"
            className={`w-5 h-5 group-hover:text-black transition-all duration-100 ${openActive ? "rotate-90 text-black" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent
          id="active-groups-content"
          className="my-2 flex mx-5 flex-col gap-2">
          {/* Create group button */}
          <button
            type="button"
            aria-label={t("createGroup")}
            className="text-sm cursor-pointer flex hover:font-bold justify-between transition-all duration-100 text-black border bg-white rounded-[12px] py-1.5 px-3 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2">
            {t("createGroup")}
            <PlusCircleIcon
              aria-hidden="true"
              className="w-5 h-5"
            />
          </button>

          {loading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            </div>
          ) : (
            <GroupList
              groups={activeGroups}
              openGroupId={openGroupId}
              onToggleGroup={toggleGroup}
            />
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
          className={`w-full cursor-pointer hover:bg-white py-1.5 px-3 rounded-[12px] transition-all duration-150 flex justify-between items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 ${openArchived ? "bg-white" : ""}`}>
          <span
            className={`text-sm group-hover:font-bold group-hover:text-black ${openArchived ? "text-black font-bold" : ""}`}>
            {t("yourArchives")}
          </span>
          <ChevronRight
            aria-hidden="true"
            className={`w-5 h-5 group-hover:text-black transition-all duration-100 ${openArchived ? "rotate-90 text-black" : ""}`}
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
            <GroupList
              groups={archivedGroups}
              openGroupId={openGroupId}
              onToggleGroup={toggleGroup}
            />
          )}
        </CollapsibleContent>
      </Collapsible>
    </nav>
  );
}
