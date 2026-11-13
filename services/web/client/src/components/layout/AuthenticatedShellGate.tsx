"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import AppShellSkeleton from "@/components/layout/AppShellSkeleton";
import { authenticatedShellLoader } from "@/components/layout/authenticatedShellLoader";
import type { AuthenticatedShellProps } from "@/components/layout/AuthenticatedShell";
import { useKeycloak } from "@/providers/KeycloakProvider";
import { reportClientIssue } from "@/logger/reportClientIssue";

/**
 * Rendered by `KeycloakProvider` once authenticated: fetches the application shell (usually
 * already in flight since the Keycloak callback) and keeps the auth skeleton meanwhile, so the
 * user sees one continuous skeleton (FR-auth-loading-skeleton). A failed fetch keeps the frame
 * and offers a retry instead of a blank page.
 * @see FR-web-first-load-performance (Slow-network authentication round trip, requirement 11)
 */
export default function AuthenticatedShellGate({ children }: { children: ReactNode }) {
  const { logout } = useKeycloak();
  const [Shell, setShell] = useState<ComponentType<AuthenticatedShellProps> | null>(() =>
    authenticatedShellLoader.getLoaded(),
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (Shell || failed) return;

    let cancelled = false;
    authenticatedShellLoader
      .load()
      .then((loaded) => {
        if (!cancelled) setShell(() => loaded);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        reportClientIssue("error", "Application shell failed to load", "Navigation", error);
        setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [Shell, failed]);

  if (Shell) return <Shell>{children}</Shell>;

  return (
    <AppShellSkeleton
      onLogout={() => void logout()}
      onRetry={failed ? () => setFailed(false) : undefined}
    />
  );
}
