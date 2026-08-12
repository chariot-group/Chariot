"use client";

import Keycloak, { KeycloakInitOptions } from "keycloak-js";
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { usePathname } from "next/navigation";
import { setKeycloakInstance } from "@/services/ApiService";
import { saveStoredLocale, buildKeycloakAuthOptions, resolveAuthLocale } from "@/hooks/useLocalePreference";
import { purgePersistedState } from "@/store";
import { stripOidcCallbackParams } from "@/lib/stripOidcCallbackParams";
import { clearPostLoginCompleted } from "@/lib/postLoginNavigation";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("auth");

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
          .catch(() => {
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
            .catch(() => {
              setAuthenticated(false);
              setToken(null);
              const { locale } = buildKeycloakAuthOptions(window.location.pathname);
              kc.login({ locale, redirectUri: buildWelcomeRedirectUri(locale) });
            });
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        visibilityHandlerRef.current = handleVisibilityChange;
      } catch (error) {
        console.error("Keycloak initialization failed", error);
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
      await purgePersistedState();
      localStorage.removeItem("chariot_user_id");
      clearPostLoginCompleted();
    } catch (error) {
      console.error("Failed to purge persisted state on logout:", error);
    }

    try {
      if (keycloak) {
        sharedKeycloak = null;
        sharedInitPromise = null;
        await keycloak.logout({ redirectUri });
        return;
      }
    } catch (error) {
      console.error("Keycloak logout failed:", error);
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
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-3 border-b-3 border-primary"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="h-8 w-8 rounded-full bg-primary/20"></div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-white text-lg font-medium">{t("loading")}</p>
              <p className="text-white/70 text-sm">{t("pleaseWait")}</p>
            </div>
            {/* Escape hatch: loading overlay used to hide Profile/logout entirely. */}
            <button
              type="button"
              onClick={() => void logout()}
              className="mt-2 rounded-md border border-white/40 px-4 py-2 text-sm text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              {t("logoutEscape")}
            </button>
          </div>
        </div>
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
