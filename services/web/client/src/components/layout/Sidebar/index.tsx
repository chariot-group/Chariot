"use client";

import { useCampaigns } from "@/hooks/useCampaigns";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SidebarEnvironment from "@/components/layout/Sidebar/SidebarEnvironment";
import SidebarContext from "@/components/layout/Sidebar/SidebarContext";
import { ActionButton } from "@/components/layout/Sidebar/ActionButton";
import { useAppSelector } from "@/store/hooks";
import { selectIsInSession } from "@/store/slices/sessionSlice";
import React, { useRef, useState } from "react";
import { useTranslations } from "use-intl";

export default function AppSidebar() {
  useCampaigns({ autoFetch: true, pageSize: 5 });

  const isInSession = useAppSelector(selectIsInSession);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("sidebar");

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = triggerRef.current?.getBoundingClientRect();
    setMousePos({
      x: e.clientX,
      y: e.clientY - (rect?.height ?? 0), // soustrait la hauteur du trigger
    });
  };

  return (
    <Sidebar className="bg-card sm:bg-transparent text-white border-r border-sidebar-border">
      <Tooltip open={isInSession ? undefined : false}>
        <TooltipTrigger
          asChild
          className="h-full">
          <div
            ref={triggerRef}
            onMouseMove={isInSession ? handleMouseMove : undefined}>
            <SidebarHeader className={`bg-card sm:bg-transparent ${isInSession ? " pointer-events-none" : ""}`}>
              <SidebarEnvironment />
            </SidebarHeader>
            <SidebarContent className={`bg-card sm:bg-transparent ${isInSession ? "pointer-events-none" : ""}`}>
              <SidebarContext />
            </SidebarContent>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="start"
          sideOffset={0}
          className="!translate-x-0 !translate-y-0 w-50"
          style={{
            position: "fixed",
            top: mousePos.y + 12,
            left: mousePos.x + 12,
            transform: "none",
            pointerEvents: "none",
          }}>
          <span>{t("disabledInSession")}</span>
        </TooltipContent>
      </Tooltip>
      <SidebarFooter className="bg-card sm:bg-transparent">
        <ActionButton />
      </SidebarFooter>
    </Sidebar>
  );
}
