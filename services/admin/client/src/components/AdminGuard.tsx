"use client";

import { useKeycloak } from "@/providers/KeycloakProvider";
import { ShieldX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { loading, authenticated, isAdmin, logout } = useKeycloak();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (authenticated && !isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <ShieldX className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold text-card-foreground">Accès refusé</h1>
        <p className="text-sm text-muted-foreground">Vous n&apos;avez pas les droits administrateur nécessaires.</p>
        <Button
          variant="destructive"
          onClick={logout}>
          Se déconnecter
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
