"use client";

import { useCampaigns } from "@/hooks/useCampaigns";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import SidebarEnvironment from "@/components/layout/Sidebar/SidebarEnvironment";
import SidebarContext from "@/components/layout/Sidebar/SidebarContext";
import { ActionButton } from "@/components/layout/Sidebar/ActionButton";
import { useAppSelector } from "@/store/hooks";
import { selectIsInSession } from "@/store/slices/sessionSlice";
import React, { useState } from "react";
import { useTranslations } from "use-intl";
import { cn } from "@/lib/utils";

const TOOLTIP_CURSOR_OFFSET = 4;
type TooltipScope = "header" | "content" | null;

export default function AppSidebar() {
  useCampaigns({ autoFetch: true, pageSize: 5 });

  const isInSession = useAppSelector(selectIsInSession);
  const contextMode = useAppSelector((state) => state.environment.contextMode);
  const isContextDisabled = isInSession && contextMode !== "gm";
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tooltipScope, setTooltipScope] = useState<TooltipScope>(null);
  const t = useTranslations("sidebar");

  const handleMouseMoveHeader = (e: React.MouseEvent) => {
    setMousePos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseMoveContent = (e: React.MouseEvent) => {
    setMousePos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <Sidebar className="bg-card sm:bg-transparent text-white border-r border-sidebar-border">
      <SidebarHeader className="bg-card sm:bg-transparent">
        <div
          className={`${contextMode !== "gm" ? "h-full" : ""}`}
          onMouseEnter={isInSession ? () => setTooltipScope("header") : undefined}
          onMouseLeave={isInSession ? () => setTooltipScope(null) : undefined}
          onMouseMove={isInSession ? handleMouseMoveHeader : undefined}>
          <div className={isInSession ? "pointer-events-none" : ""}>
            <SidebarEnvironment />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent
        className={cn(
          "bg-card sm:bg-transparent",
          contextMode !== "gm" && "overflow-hidden",
        )}>
        <div
          className={cn(
            contextMode !== "gm" && "flex h-full min-h-0 flex-1 flex-col",
          )}
          onMouseEnter={isContextDisabled ? () => setTooltipScope("content") : undefined}
          onMouseLeave={isContextDisabled ? () => setTooltipScope(null) : undefined}
          onMouseMove={isContextDisabled ? handleMouseMoveContent : undefined}>
          <div
            className={cn(
              isContextDisabled && "pointer-events-none",
              contextMode !== "gm" && "flex min-h-0 flex-1 flex-col",
            )}>
            <SidebarContext />
          </div>
        </div>
      </SidebarContent>

      {((isInSession && tooltipScope === "header") || (isContextDisabled && tooltipScope === "content")) && (
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

      <SidebarFooter className="bg-card sm:bg-transparent">
        <ActionButton />
      </SidebarFooter>
    </Sidebar>
  );
}
