"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { Group } from "@/types/campaign";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { selectSelectedCampaignId } from "@/store/slices/campaignContextSlice";
import { ContextMenu, ContextMenuTrigger } from "@radix-ui/react-context-menu";
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSidebar } from "@/components/ui/sidebar";

interface GroupListProps {
  groups: Group[];
  openGroupId: string | null;
  onToggleGroup: (groupId: string) => void;
}

/**
 * Group list component
 * Displays groups with their characters in collapsible sections
 * Highlights currently selected character
 * Provides context menu for group actions (archive, etc.)
 */
export default function GroupList({ groups, openGroupId, onToggleGroup }: GroupListProps) {
  const t = useTranslations("sidebar");
  const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

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
        const isOpen = openGroupId === group._id;

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
                  className={`w-full bg-card cursor-pointer hover:font-bold py-1.5 px-3 rounded-[12px] transition-all duration-100 flex justify-between items-center group focus-visible:border ${isOpen ? "font-bold" : ""}`}>
                  <span className={`text-sm text-left group-hover:font-bold ${isOpen ? "font-bold" : ""}`}>
                    {group.label}
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className={`w-4 h-4 transition-all duration-100 ${isOpen ? "rotate-90" : ""}`}
                  />
                </CollapsibleTrigger>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-full flex-col bg-card cursor-pointer hover:font-bold py-1.5 px-3 rounded-[12px] transition-all duration-100 flex group">
                <ContextMenuItem
                  className="cursor-pointer focus-visible:border"
                  onClick={() => {
                    console.log("Archived");
                  }}>
                  {t("archive")}
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
                      className={`text-xs py-1.5 px-3 rounded-[8px] flex items-center gap-2 hover:bg-card/50 transition-all duration-100 cursor-pointer focus-visible:ring-1 ${
                        isSelected ? "bg-card/50 font-bold" : ""
                      }`}
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}>
                      {character.firstname} {character.lastname}
                    </Link>
                  );
                })
              ) : (
                <div className="text-xs text-gray-400 px-3 py-1">{t("noCharacters")}</div>
              )}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
