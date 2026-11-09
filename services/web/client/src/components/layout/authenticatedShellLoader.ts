import { createLazyComponentLoader } from "@/lib/lazyComponentLoader";
import type { AuthenticatedShellProps } from "@/components/layout/AuthenticatedShell";

/**
 * The authenticated application shell (Redux, sidebar, header, session clients…) is a separate
 * chunk: the auth gate reaches Keycloak without downloading it, and the return from Keycloak
 * fetches it while the authorization code is exchanged.
 * @see FR-web-first-load-performance (Slow-network authentication round trip, requirement 11)
 */
export const authenticatedShellLoader = createLazyComponentLoader<AuthenticatedShellProps>(
  () => import("@/components/layout/AuthenticatedShell"),
);
