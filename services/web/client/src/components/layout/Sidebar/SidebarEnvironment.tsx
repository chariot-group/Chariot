"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ContextMode, setContextMode } from "@/store/slices/environmentSlice";
import { clearSelectedCampaign } from "@/store/slices/campaignContextSlice";
import { selectOpenEnvironment, setOpenEnvironment } from "@/store/slices/sidebarSlice";
import { ChevronRight, PlusCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import CampaignList from "./CampaignList";

/**
 * Environment selector component
 * Allows switching between player and GM modes
 * Displays campaign list for GM mode
 */
export default function SidebarEnvironment() {
  const t = useTranslations("sidebar");
  const dispatch = useAppDispatch();
  const open = useAppSelector(selectOpenEnvironment);

  /**
   * Handle environment mode change
   * When switching to player mode, clear selected campaign and redirect to home
   */
  const changeEnvironment = (environment: ContextMode) => {
    dispatch(setContextMode(environment));

    if (environment === "player") {
      window.location.href = "/";
      dispatch(clearSelectedCampaign());
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    dispatch(setOpenEnvironment(isOpen));
  };

  return (
    <Collapsible
      className="rounded-[15px] border-2"
      open={open}
      onOpenChange={handleOpenChange}>
      <CollapsibleTrigger
        className={`w-full ${open && "bg-white"} border cursor-pointer hover:bg-white py-1.5 px-3 rounded-[12px] transition-all duration-150 flex justify-between items-center group`}>
        <span className={`text-sm ${open && "text-black font-bold"} group-hover:font-bold group-hover:text-black`}>
          {t("yourSpaces")}
        </span>
        <ChevronRight
          className={`w-5 h-5 ${open && "rotate-90 text-black"} group-hover:text-black transition-all duration-100`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="my-2 flex mx-5 flex-col gap-2">
        {/* Player mode button */}
        <span
          onClick={() => changeEnvironment("player")}
          className="text-sm text-black cursor-pointer border hover:font-bold bg-white transition-all duration-100 rounded-[12px] py-1.5 px-3 w-full">
          {t("yourCharacters")}
        </span>

        <div className="w-full border" />

        {/* Create campaign button (GM mode) */}
        <span
          onClick={() => changeEnvironment("gm")}
          className="text-sm cursor-pointer flex hover:font-bold justify-between transition-all duration-100 text-black border bg-white rounded-[12px] py-1.5 px-3 w-full">
          {t("createCampaign")}
          <PlusCircleIcon className="w-5 h-5" />
        </span>

        {/* Campaign list */}
        <CampaignList />
      </CollapsibleContent>
    </Collapsible>
  );
}
