"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import SidebarContext from "./SidebarContext";
import React from "react";
import SidebarEnvironment from "./SidebarEnvironment";

export default function Sidebar() {
  const t = useTranslations("sidebar");
  const sidebarRef = useRef<HTMLElement>(null);

  return (
    <React.Fragment>
      {/* Sidebar */}
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
        {/* Environment */}
        <div className={cn("mx-6 py-6 border-b ")}>
          <SidebarEnvironment />
        </div>

        {/* Navigation */}
        <SidebarContext />
      </aside>

      {/* Spacer for desktop to prevent content overlap */}
      <div
        className={cn("hidden lg:block shrink-0 transition-all duration-300", "w-80")}
        aria-hidden="true"
      />
    </React.Fragment>
  );
}
