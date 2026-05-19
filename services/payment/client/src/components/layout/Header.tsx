"use client";

import { usePathname } from "next/navigation";
import { LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKeycloak } from "@/providers/KeycloakProvider";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/promo-codes": "Codes promo",
  "/affiliations": "Affiliations",
  "/payments": "Paiements",
};

export function Header() {
  const pathname = usePathname();
  const { logout, keycloak } = useKeycloak();

  const title =
    Object.entries(titles).find(([path]) => (path === "/" ? pathname === "/" : pathname.startsWith(path)))?.[1] ??
    "Admin";

  const username = (keycloak?.tokenParsed as Record<string, unknown> | undefined)?.preferred_username as
    | string
    | undefined;

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
      <h1 className="text-base font-semibold text-card-foreground">{title}</h1>
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
