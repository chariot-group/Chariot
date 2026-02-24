"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useCampaigns } from "@/hooks/useCampaigns";

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from "@/components/ui/sidebar";
import SidebarEnvironment from "./SidebarEnvironment";
import SidebarContext from "./SidebarContext";
import { ActionButton } from "./ActionButton";

/**
 * Main sidebar component
 * Displays environment selector, context navigation, and action button
 * Auto-loads campaigns on component mount
 * Transforms into a burger menu on mobile (< 425px)
 */
export default function AppSidebar() {
  const t = useTranslations("sidebar");
  const sidebarRef = useRef<HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auto-fetch campaigns on component mount
  useCampaigns({
    autoFetch: true,
    pageSize: 5,
  });

  return (
    <Sidebar className="bg-card sm:bg-transparent text-white border-r border-sidebar-border">
      <SidebarHeader className="bg-card sm:bg-transparent">
        <SidebarEnvironment />
      </SidebarHeader>
      <SidebarContent className="bg-card sm:bg-transparent">
        <SidebarContext />
      </SidebarContent>
      <SidebarFooter className="bg-card sm:bg-transparent">
        <ActionButton />
      </SidebarFooter>
    </Sidebar>
  );

  // return (
  //   <>
  //     {/* Burger menu button - visible only on mobile < 1280px */}

  //     {/* Fixed sidebar */}
  //     <aside
  //       ref={sidebarRef}
  //       className={cn(
  //         "fixed left-0 top-0 z-50 h-screen",
  //         "bg-card xl:bg-transparent text-white border-r border-sidebar-border",
  //         "flex flex-col transition-all duration-300",
  //         "w-52 sm:w-80",
  //         // Hide on mobile by default, show when menu is open
  //         !isMenuOpen && "-translate-x-full xl:translate-x-0",
  //       )}
  //       role="navigation"
  //       aria-label={t("mainNavigation")}>
  //       {/* Environment selector (player/GM mode) */}
  //       <div className={cn("mx-3 sm:mx-4 md:mx-5 lg:mx-6 py-4 sm:py-5 md:py-6 border-b")}>
  //         <SidebarEnvironment />
  //       </div>

  //       {/* Navigation (context-dependent) */}
  //       <div className={cn("flex-1 overflow-y-auto px-2 sm:px-2.5 md:px-3")}>
  //         <SidebarContext />
  //       </div>

  //       {/* Action button (context-dependent) */}
  //       <div className={cn("mx-3 sm:mx-4 md:mx-5 lg:mx-6 py-4 sm:py-5 md:py-6 border-t")}>
  //         <ActionButton />
  //       </div>
  //     </aside>

  //     {/* Spacer to prevent content overlap on desktop */}
  //     <div
  //       className={cn("shrink-0 transition-all duration-300", "hidden xl:block", "xl:w-80")}
  //       aria-hidden="true"
  //     />
  //   </>
  // );
}
