"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useKeycloak } from "@/providers/KeycloakProvider";
import NavigationService from "@/services/NavigationService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

/**
 * Component responsible for handling post-login navigation (FR-006)
 * Must be rendered INSIDE ReduxProvider to access Redux store
 * Listens to authentication state from KeycloakContext
 */
export default function PostLoginNavigator() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "fr";
  const { authenticated, loading } = useKeycloak();
  const dispatch = useAppDispatch();

  // Ref to track if we've already handled initial auth redirect
  const hasHandledAuthRef = useRef(false);

  useEffect(() => {
    const handlePostLoginNavigation = async () => {
      // Ne rediriger que si:
      // 1. L'utilisateur est authentifié
      // 2. Le chargement est terminé
      // 3. On n'a pas déjà géré la redirection
      // 4. L'utilisateur est sur une page qui nécessite une redirection
      if (authenticated && !loading && !hasHandledAuthRef.current) {
        if (NavigationService.shouldRedirectAfterLogin(pathname)) {
          hasHandledAuthRef.current = true;

          try {
            const destination = await NavigationService.determinePostLoginDestination(locale, dispatch);
            router.push(destination.path);
          } catch (error) {
            console.error("Failed to determine post-login destination:", error);
            // Fallback vers welcome en cas d'erreur
            router.push(`/${locale}/welcome`);
          }
        }
      }
    };

    handlePostLoginNavigation();
  }, [authenticated, loading, pathname, locale, router, dispatch]);

  // Ce composant ne rend rien, il gère uniquement la navigation
  return null;
}
