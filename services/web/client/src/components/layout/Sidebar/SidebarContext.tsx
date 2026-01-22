"use client";

import { Swords, Users, Map, BookOpen, Settings, LayoutDashboard, UserCog, Scroll, Castle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/store/hooks";
import { selectContextMode } from "@/store/slices/environmentSlice";
import SidebarItem from "./SidebarItem";

export default function SidebarContext() {
  const t = useTranslations("sidebar");
  const contextMode = useAppSelector(selectContextMode);

  // Player context navigation
  const playerNavItems = [
    { href: "/demo", icon: Map, label: t("campaigns") },
    { href: "/characters", icon: Users, label: t("characters") },
    { href: "/battle", icon: Swords, label: t("battle") },
    { href: "/journal", icon: BookOpen, label: t("journal") },
  ];

  // Game Master context navigation
  const gmNavItems = [
    { href: "/gm/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { href: "/gm/campaigns", icon: Castle, label: t("campaignManagement") },
    { href: "/gm/npcs", icon: UserCog, label: t("npcManagement") },
    { href: "/gm/encounters", icon: Swords, label: t("encounters") },
    { href: "/gm/world", icon: Scroll, label: t("worldBuilder") },
  ];

  const navItems = contextMode === "gm" ? gmNavItems : playerNavItems;

  return (
    <nav
      className="flex-1 overflow-y-auto px-3 py-4"
      aria-label={contextMode === "gm" ? t("gmNavigation") : t("playerNavigation")}>
      <div className="space-y-1">
        {navItems.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </div>
    </nav>
  );
}
