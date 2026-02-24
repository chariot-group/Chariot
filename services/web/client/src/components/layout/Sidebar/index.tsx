"use client";

import { useCampaigns } from "@/hooks/useCampaigns";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
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
}
