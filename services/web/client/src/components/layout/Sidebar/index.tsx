"use client";

import { useCampaigns } from "@/hooks/useCampaigns";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import SidebarEnvironment from "@/components/layout/Sidebar/SidebarEnvironment";
import SidebarContext from "@/components/layout/Sidebar/SidebarContext";
import { ActionButton } from "@/components/layout/Sidebar/ActionButton";
import { QuickLinksList } from "@/components/layout/Sidebar/QuickLinksList";
import { useAppSelector } from "@/store/hooks";
import { selectIsInSession, selectSessionStatus } from "@/store/slices/sessionSlice";
import { selectContextMode } from "@/store/slices/environmentSlice";
import { selectSelectedCampaign } from "@/store/slices/campaignSlice";
import React, { useState } from "react";
import { useTranslations } from "use-intl";

const TOOLTIP_CURSOR_OFFSET = 4;

export default function AppSidebar() {
  useCampaigns({ autoFetch: true, pageSize: 5 });

  const isInSession = useAppSelector(selectIsInSession);
  const sessionStatus = useAppSelector(selectSessionStatus);
  const contextMode = useAppSelector(selectContextMode);
  const selectedCampaign = useAppSelector(selectSelectedCampaign);
  const isSessionLaunched = isInSession && sessionStatus === "launched";
  const actionsDisabled = isSessionLaunched;
  const quickLinksCampaignId = contextMode === "gm" ? (selectedCampaign?._id ?? null) : null;
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [headerTooltipVisible, setHeaderTooltipVisible] = useState(false);
  const t = useTranslations("sidebar");

  const handleMouseMoveHeader = (e: React.MouseEvent) => {
    setMousePos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <Sidebar className="sm:bg-transparent text-white border-r border-sidebar-border">
      <SidebarHeader className="sm:bg-transparent">
        <div
          onMouseEnter={isSessionLaunched ? () => setHeaderTooltipVisible(true) : undefined}
          onMouseLeave={isSessionLaunched ? () => setHeaderTooltipVisible(false) : undefined}
          onMouseMove={isSessionLaunched ? handleMouseMoveHeader : undefined}>
          <div className={isSessionLaunched ? "pointer-events-none" : ""}>
            <SidebarEnvironment />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="sm:bg-transparent overflow-hidden">
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
            <SidebarContext />
          </div>
        </div>
      </SidebarContent>

      {isSessionLaunched && headerTooltipVisible && (
        <div
          role="tooltip"
          className="bg-foreground text-background z-50 w-50 rounded-[15px] px-3 py-1.5 text-xs text-balance pointer-events-none fixed"
          style={{
            top: mousePos.y + TOOLTIP_CURSOR_OFFSET,
            left: mousePos.x + TOOLTIP_CURSOR_OFFSET,
          }}>
          <span>{t("disabledInSession")}</span>
        </div>
      )}

      <div className="relative z-10 shrink-0 overflow-hidden bg-background px-3 pt-2 pb-2">
        <QuickLinksList
          campaignId={quickLinksCampaignId}
          disabled={actionsDisabled}
        />
      </div>

      <SidebarFooter className="bg-card sm:bg-transparent">
        <ActionButton />
      </SidebarFooter>
    </Sidebar>
  );
}
