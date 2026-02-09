"use client";

import Keycloak, { KeycloakInitOptions } from "keycloak-js";
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setKeycloakInstance } from "@/services/ApiService";
import { detectBrowserLocale, saveStoredLocale, getStoredLocale } from "@/hooks/useLocalePreference";
import { purgePersistedState } from "@/store";
import { useTranslations } from "next-intl";

interface KeycloakContextType {
  keycloak: Keycloak | null;
  authenticated: boolean;
  loading: boolean;
  token: string | null;
  userTransitioning: boolean; // Solution 1: État de transition utilisateur
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

export function KeycloakProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "fr";
  const t = useTranslations("auth");

  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userTransitioning, setUserTransitioning] = useState(false); // Solution 1

  // Ref to store interval ID
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initKeycloak = async () => {
      const keycloakConfig = {
        url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080",
        realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "chariot",
        clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "chariot-app",
      };

      const kc = new Keycloak(keycloakConfig);

      try {
        const initOptions: KeycloakInitOptions = {
          onLoad: "login-required",
          checkLoginIframe: false,
          pkceMethod: "S256",
        };

        const authenticated = await kc.init(initOptions);

        // Detect user change and handle cache transition (Solution 5 + Solution 1)
        if (authenticated && kc.tokenParsed?.sub) {
          const currentUserId = kc.tokenParsed.sub;
          const storedUserId = localStorage.getItem("chariot_user_id");

          if (storedUserId && storedUserId !== currentUserId) {
            // Different user detected - signal transition state
            console.log(`User change detected: ${storedUserId} -> ${currentUserId}`);
            setUserTransitioning(true);

            // With Solution 5, each user has isolated cache - no need to purge
            // Just update the stored user ID and the store will use the correct cache
            localStorage.setItem("chariot_user_id", currentUserId);

            // Signal that we need to recreate the Redux store with new user cache
            // This will be handled by ReduxProvider
            window.dispatchEvent(
              new CustomEvent("chariot:user-changed", {
                detail: { userId: currentUserId },
              }),
            );

            // Transition completes after a short delay to ensure store recreation
            setTimeout(() => {
              setUserTransitioning(false);
            }, 300);
          } else {
            // First login or same user - just store ID
            localStorage.setItem("chariot_user_id", currentUserId);
          }
        } else if (!authenticated) {
          // User logged out - clear stored ID
          localStorage.removeItem("chariot_user_id");
        }

        setKeycloak(kc);
        setAuthenticated(authenticated);
        setToken(kc.token || null);

        // Pass Keycloak instance to apiClient
        setKeycloakInstance(kc);

        // Configure automatic refresh only if authenticated
        if (authenticated && kc.token) {
          // Clean up old interval if it exists
          if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
          }

          // Configure new automatic refresh
          refreshIntervalRef.current = setInterval(() => {
            kc.updateToken(70) // Refresh if expires in less than 70 seconds
              .then((refreshed) => {
                if (refreshed) {
                  setToken(kc.token || null);
                }
              })
              .catch(() => {
                setAuthenticated(false);
                setToken(null);
                kc.login();
              });
          }, 60000); // Check every 60 seconds
        }

        setLoading(false);
      } catch (error) {
        console.error("Keycloak initialization failed", error);
        setLoading(false);
      }
    };

    initKeycloak();

    // Cleanup function
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Removed automatic URL cleaning that was causing infinite loop

  const login = () => {
    keycloak?.login({
      redirectUri: window.location.origin + `/${locale}`,
      locale: locale,
    });
  };

  const logout = async () => {
    setLoading(true);

    // Clean up interval before logging out
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Purge Redux persisted state to prevent data leakage between users
    try {
      await purgePersistedState();
      // Remove stored user ID to ensure fresh start on next login
      localStorage.removeItem("chariot_user_id");
    } catch (error) {
      console.error("Failed to purge persisted state on logout:", error);
    }

    // Redirect to root after logout - Keycloak will handle the login page
    keycloak?.logout({
      redirectUri: window.location.origin + `/${locale}`,
    });
  };

  const register = () => {
    const detectedLocale = detectBrowserLocale();
    saveStoredLocale(detectedLocale);

    keycloak?.register({
      redirectUri: window.location.origin + `/${detectedLocale}`,
      locale: detectedLocale,
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
