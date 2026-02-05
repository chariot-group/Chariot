"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import SidebarContext from "@/components/layout/Sidebar/SidebarContext";
import SidebarEnvironment from "@/components/layout/Sidebar/SidebarEnvironment";
import { ActionButton } from "@/components/layout/Sidebar/ActionButton";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Menu, X } from "lucide-react";
import React from "react";

/**
 * Main sidebar component
 * Displays environment selector, context navigation, and action button
 * Auto-loads campaigns on component mount
 * Transforms into a burger menu on mobile (< 425px)
 */
export default function Sidebar() {
  const t = useTranslations("sidebar");
  const sidebarRef = useRef<HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auto-fetch campaigns on component mount
  useCampaigns({
    autoFetch: true,
    pageSize: 5,
  });

  return (
    <React.Fragment>
      {/* Burger menu button - visible only on mobile and tablet < 1024px */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={cn(
          "fixed top-4 left-4 z-[60] lg:hidden cursor-pointer",
          "bg-background text-white p-2 rounded-md",
          "hover:bg-card transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isMenuOpen && "translate-x-[13rem] md:translate-x-[20rem]",
        )}
        aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
        aria-expanded={isMenuOpen}>
        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Backdrop for mobile menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Fixed sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen",
          "bg-card lg:bg-transparent text-white border-r border-sidebar-border",
          "flex flex-col transition-all duration-300",
          "w-52 md:w-80",
          // Hide on mobile/tablet by default, show when menu is open
          !isMenuOpen && "-translate-x-full lg:translate-x-0",
        )}
        role="navigation"
        aria-label={t("mainNavigation")}>
        {/* Environment selector (player/GM mode) */}
        <div className={cn("mx-3 sm:mx-4 md:mx-5 lg:mx-6 py-4 sm:py-5 md:py-6 border-b")}>
          <SidebarEnvironment />
        </div>

        {/* Navigation (context-dependent) */}
        <div className={cn("flex-1 overflow-y-auto px-2 sm:px-2.5 md:px-3")}>
          <SidebarContext />
        </div>

        {/* Action button (context-dependent) */}
        <div className={cn("mx-3 sm:mx-4 md:mx-5 lg:mx-6 py-4 sm:py-5 md:py-6 border-t")}>
          <ActionButton />
        </div>
      </aside>

      {/* Spacer to prevent content overlap on desktop */}
      <div
        className={cn("shrink-0 transition-all duration-300", "hidden lg:block", "w-40 md:w-80")}
        aria-hidden="true"
      />
    </React.Fragment>
  );
}
