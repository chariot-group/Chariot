"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import SidebarContext from "./SidebarContext";
import SidebarEnvironment from "./SidebarEnvironment";
import { ActionButton } from "./ActionButton";
import { useCampaigns } from "@/hooks/useCampaigns";

/**
 * Main sidebar component
 * Displays environment selector, context navigation, and action button
 * Auto-loads campaigns on mount for GM mode
 */
export default function Sidebar() {
  const t = useTranslations("sidebar");
  const sidebarRef = useRef<HTMLElement>(null);

  // Auto-fetch campaigns on component mount
  useCampaigns({
    autoFetch: true,
    pageSize: 5,
  });

  return (
    <>
      {/* Fixed sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen",
          "bg-transparent text-white border-r border-sidebar-border",
          "flex flex-col transition-all duration-300",
          "lg:w-80",
        )}
        role="navigation"
        aria-label={t("mainNavigation")}>
        {/* Environment selector (player/GM mode) */}
        <div className={cn("mx-6 py-6 border-b")}>
          <SidebarEnvironment />
        </div>

        {/* Campaign and group navigation */}
        <div className={cn("flex-1 overflow-y-auto px-3")}>
          <SidebarContext />
        </div>

        {/* Action button (context-dependent) */}
        <div className={cn("mx-6 py-6 border-t")}>
          <ActionButton />
        </div>
      </aside>

      {/* Spacer to prevent content overlap on desktop */}
      <div
        className={cn("hidden lg:block shrink-0 transition-all duration-300", "w-80")}
        aria-hidden="true"
      />
    </>
  );
}
