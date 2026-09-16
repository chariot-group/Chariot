"use client";

import { usePathname } from "next/navigation";
import { LogOut, Menu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKeycloak } from "@/providers/KeycloakProvider";
import { useSidebar } from "@/providers/SidebarContext";

const titles: Record<string, string> = {
  "/business/adventure": "KPI Adventure",
  "/business/session": "KPI Session",
  "/business/payment": "KPI Paiement",
  "/business": "Dashboard business",
  "/": "Dashboard paiements",
  "/promo-codes": "Codes promo",
  "/affiliations": "Affiliations",
  "/payments": "Paiements",
  "/referrals": "Parrainage",
};

export function Header() {
  const pathname = usePathname();
  const { logout, keycloak } = useKeycloak();
  const { toggle } = useSidebar();

  const title =
    Object.entries(titles)
      .sort(([a], [b]) => b.length - a.length)
      .find(([path]) => (path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`)))?.[1] ??
    "Admin";

  const username = (keycloak?.tokenParsed as Record<string, unknown> | undefined)?.preferred_username as
    | string
    | undefined;

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden h-8 w-8 p-0"
          onClick={toggle}
          aria-label="Menu">
          <Menu className="h-4 w-4" />
        </Button>
        <h1 className="text-base font-semibold text-card-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span>{username ?? "Admin"}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}>
          <LogOut className="h-3.5 w-3.5" />
          Déconnexion
        </Button>
      </div>
    </header>
  );
}
