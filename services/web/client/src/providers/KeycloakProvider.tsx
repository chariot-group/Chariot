"use client";

import Keycloak, { KeycloakInitOptions } from "keycloak-js";
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { usePathname } from "next/navigation";
import { setKeycloakInstance } from "@/lib/keycloakInstance";
import { saveStoredLocale, buildKeycloakAuthOptions, resolveAuthLocale } from "@/hooks/useLocalePreference";
import { isOidcCallbackUrl, stripOidcCallbackParams } from "@/lib/stripOidcCallbackParams";
import { authenticatedShellLoader } from "@/components/layout/authenticatedShellLoader";
import { clearPostLoginCompleted } from "@/lib/postLoginNavigation";
import { reportClientIssue } from "@/logger/reportClientIssue";
import AppShellSkeleton from "@/components/layout/AppShellSkeleton";

interface KeycloakContextType {
  keycloak: Keycloak | null;
  authenticated: boolean;
  loading: boolean;
  token: string | null;
  userTransitioning: boolean;
  login: () => void;
  logout: () => void;
  register: () => void;
}

const KeycloakContext = createContext<KeycloakContextType>({
  keycloak: null,
  authenticated: false,
  loading: true,
  token: null,
  userTransitioning: false,
  login: () => {},
  logout: () => {},
  register: () => {},
});

/** Survive layout remounts — re-init with login-required causes auth/nav loops. */
let sharedKeycloak: Keycloak | null = null;
let sharedInitPromise: Promise<boolean> | null = null;

function getSafeAppOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

function buildWelcomeRedirectUri(locale: string): string {
  return `${getSafeAppOrigin()}/${locale}/welcome`;
}

export function KeycloakProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const [keycloak, setKeycloak] = useState<Keycloak | null>(sharedKeycloak);
  const [authenticated, setAuthenticated] = useState(Boolean(sharedKeycloak?.authenticated));
  const [loading, setLoading] = useState(!sharedKeycloak?.authenticated);
  const [token, setToken] = useState<string | null>(sharedKeycloak?.token ?? null);
  const [userTransitioning, setUserTransitioning] = useState(false);

  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logoutInFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const attachRefresh = (kc: Keycloak) => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      if (!kc.authenticated || !kc.token) return;

      refreshIntervalRef.current = setInterval(() => {
        kc.updateToken(70)
          .then((refreshed) => {
            if (refreshed) setToken(kc.token || null);
          })
          .catch((error) => {
            reportClientIssue("error", "Token refresh failed", "Keycloak", error);
            setAuthenticated(false);
            setToken(null);
            const { locale } = buildKeycloakAuthOptions(window.location.pathname);
            // Land on welcome — locale root re-triggers post-login → forbidden sheet loops.
            kc.login({ locale, redirectUri: buildWelcomeRedirectUri(locale) });
          });
      }, 60000);
    };

    const initKeycloak = async () => {
      if (sharedKeycloak?.authenticated) {
        if (cancelled) return;
        setKeycloak(sharedKeycloak);
        setAuthenticated(true);
        setToken(sharedKeycloak.token || null);
        setKeycloakInstance(sharedKeycloak);
        attachRefresh(sharedKeycloak);
        setLoading(false);
        return;
      }

      const keycloakConfig = {
        url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080",
        realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "chariot",
        clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "chariot-app",
      };

      if (!sharedInitPromise) {
        // Return from Keycloak: fetch the app shell while the code is exchanged, not after
        // (FR-web-first-load-performance, slow-network round trip). A plain visit redirects
        // to Keycloak right away and must not spend bandwidth on it.
        if (isOidcCallbackUrl(window.location.href)) {
          authenticatedShellLoader.preload();
        }
        sharedKeycloak = new Keycloak(keycloakConfig);
        const initOptions: KeycloakInitOptions = {
          onLoad: "login-required",
          checkLoginIframe: false,
          pkceMethod: "S256",
          locale: resolveAuthLocale(window.location.pathname),
        };
        sharedInitPromise = sharedKeycloak.init(initOptions).catch((error) => {
          sharedInitPromise = null;
          throw error;
        });
      }

      try {
        const kc = sharedKeycloak!;
        const isAuthenticated = await sharedInitPromise;

        if (cancelled) return;

        if (isAuthenticated && kc.tokenParsed?.sub) {
          const currentUserId = kc.tokenParsed.sub;
          const storedUserId = localStorage.getItem("chariot_user_id");

          if (storedUserId && storedUserId !== currentUserId) {
            console.log(`User change detected: ${storedUserId} -> ${currentUserId}`);
            setUserTransitioning(true);
            clearPostLoginCompleted();
            localStorage.setItem("chariot_user_id", currentUserId);
            window.dispatchEvent(
              new CustomEvent("chariot:user-changed", {
                detail: { userId: currentUserId },
              }),
            );
            setTimeout(() => {
              if (!cancelled) setUserTransitioning(false);
            }, 300);
          } else {
            localStorage.setItem("chariot_user_id", currentUserId);
          }
        } else if (!isAuthenticated) {
          localStorage.removeItem("chariot_user_id");
        }

        setKeycloak(kc);
        setAuthenticated(Boolean(isAuthenticated));
        setToken(kc.token || null);
        setKeycloakInstance(kc);
        attachRefresh(kc);

        const handleVisibilityChange = () => {
          if (document.visibilityState !== "visible") return;

          kc.updateToken(70)
            .then((refreshed) => {
              if (refreshed) setToken(kc.token || null);
            })
            .catch((error) => {
              reportClientIssue("error", "Token refresh failed", "Keycloak", error);
              setAuthenticated(false);
              setToken(null);
              const { locale } = buildKeycloakAuthOptions(window.location.pathname);
              kc.login({ locale, redirectUri: buildWelcomeRedirectUri(locale) });
            });
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        visibilityHandlerRef.current = handleVisibilityChange;
      } catch (error) {
        reportClientIssue("error", "Keycloak initialization failed", "Keycloak", error);
        sharedInitPromise = null;
      } finally {
        if (!cancelled) {
          stripOidcCallbackParams();
          setLoading(false);
        }
      }
    };

    void initKeycloak();

    return () => {
      cancelled = true;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (visibilityHandlerRef.current) {
        document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
      }
    };
  }, []);

  const login = () => {
    const { locale, redirectUri } = buildKeycloakAuthOptions(pathname);
    keycloak?.login({
      redirectUri,
      locale,
    });
  };

  const logout = async () => {
    if (logoutInFlightRef.current) return;
    logoutInFlightRef.current = true;
    setLoading(true);

    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    const { locale } = buildKeycloakAuthOptions(pathname);
    const redirectUri = buildWelcomeRedirectUri(locale);

    try {
      // Loaded on demand: the store is part of the authenticated shell, not of the auth gate.
      const { purgePersistedState } = await import("@/store");
      await purgePersistedState();
      localStorage.removeItem("chariot_user_id");
      clearPostLoginCompleted();
    } catch (error) {
      reportClientIssue("error", "Failed to purge persisted state on logout", "Storage", error);
    }

    try {
      if (keycloak) {
        sharedKeycloak = null;
        sharedInitPromise = null;
        await keycloak.logout({ redirectUri });
        return;
      }
    } catch (error) {
      reportClientIssue("error", "Keycloak logout failed", "Keycloak", error);
    }

    // Hard escape if Keycloak logout hangs/fails (e.g. SSO just restarted).
    sharedKeycloak = null;
    sharedInitPromise = null;
    window.location.assign(redirectUri);
  };

  const register = () => {
    const { locale, redirectUri } = buildKeycloakAuthOptions(pathname);
    saveStoredLocale(locale);

    keycloak?.register({
      redirectUri,
      locale,
    });
  };

  return (
    <KeycloakContext.Provider
      value={{
        keycloak,
        authenticated,
        loading,
        token,
        userTransitioning,
        login,
        logout,
        register,
      }}>
      {loading || userTransitioning ? (
        <AppShellSkeleton onLogout={() => void logout()} />
      ) : (
        children
      )}
    </KeycloakContext.Provider>
  );
}

export function useKeycloak() {
  const context = useContext(KeycloakContext);
  if (!context) {
    throw new Error("useKeycloak must be used within KeycloakProvider");
  }
  return context;
}
