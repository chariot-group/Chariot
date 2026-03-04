"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ContextMode, setContextMode } from "@/store/slices/environmentSlice";
import { selectOpenEnvironment, setOpenEnvironment } from "@/store/slices/sidebarSlice";
import { ChevronRight, PlusCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import CampaignList from "@/components/layout/Sidebar/CampaignList";

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
      handleOpenChange(false);
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
        aria-expanded={open}
        aria-controls="spaces-content"
        className={`w-full cursor-pointer hover:bg-white py-1.5 px-3 rounded-[12px] transition-all duration-150 flex justify-between items-center group/environment focus-visible:border ${open ? "bg-white" : ""}`}>
        <span
          className={`text-sm group-hover/environment:font-bold group-hover/environment:text-black ${open ? "text-black font-bold" : ""}`}>
          {t("yourSpaces")}
        </span>
        <ChevronRight
          aria-hidden="true"
          className={`w-5 h-5 group-hover/environment:text-black transition-all duration-100 ${open ? "rotate-90 text-black" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        id="spaces-content"
        className="my-2 flex mx-5 flex-col gap-2">
        <button
          type="button"
          onClick={() => changeEnvironment("player")}
          aria-label={t("yourCharacters")}
          className="text-sm text-black cursor-pointer border hover:font-bold bg-white transition-all duration-100 rounded-xl py-1.5 px-3 w-full text-left focus-visible:border">
          {t("yourCharacters")}
        </button>

        <div
          className="w-full border"
          aria-hidden="true"
        />

        {/* Switch to GM mode and create campaign */}
        <button
          type="button"
          onClick={() => changeEnvironment("gm")}
          aria-label={t("createCampaign")}
          className="text-sm cursor-pointer flex hover:font-bold justify-between transition-all duration-100 text-black border bg-white rounded-[12px] py-1.5 px-3 w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black focus-visible:ring-offset-2">
          {t("createCampaign")}
          <PlusCircleIcon className="w-5 h-5" />
        </button>

        {/* Campaign list */}
        <CampaignList />
      </CollapsibleContent>
    </Collapsible>
  );
}
