"use client";

import Keycloak, { KeycloakInitOptions } from "keycloak-js";
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setKeycloakInstance } from "@/services/ApiService";
import { detectBrowserLocale, saveStoredLocale, getStoredLocale } from "@/hooks/useLocalePreference";
import { Locale } from "@/i18n/request";
import { useTranslations } from "next-intl";

interface KeycloakContextType {
  keycloak: Keycloak | null;
  authenticated: boolean;
  loading: boolean;
  token: string | null;
  login: () => void;
  logout: () => void;
  register: () => void;
}

const KeycloakContext = createContext<KeycloakContextType>({
  keycloak: null,
  authenticated: false,
  loading: true,
  token: null,
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
  const [isNewRegistration, setIsNewRegistration] = useState(false);

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
          onLoad: "check-sso",
          checkLoginIframe: true,
          silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
          pkceMethod: "S256",
        };

        const authenticated = await kc.init(initOptions);

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

  useEffect(() => {
    if (loading || !keycloak) return;

    // If user just registered, save their locale and redirect
    if (isNewRegistration && authenticated) {
      const detectedLocale = detectBrowserLocale();
      saveStoredLocale(detectedLocale);

      // Redirect to detected locale if different from current
      if (locale !== detectedLocale) {
        router.push(`/${detectedLocale}`);
      }

      setIsNewRegistration(false);
      return;
    }

    // If user is not authenticated, redirect to login with their preferred locale
    if (!authenticated) {
      const preferredLocale = getStoredLocale() || locale;
      keycloak.login({
        redirectUri: window.location.origin + `/${preferredLocale}`,
        locale: preferredLocale,
      });
    } else {
      // If user is authenticated, check if we should redirect to their preferred locale
      const preferredLocale = getStoredLocale();
      if (preferredLocale && preferredLocale !== locale) {
        router.push(`/${preferredLocale}${pathname.substring(3)}`);
      }
    }
  }, [authenticated, loading, keycloak, locale, isNewRegistration, router, pathname]);

  const login = () => {
    keycloak?.login({
      redirectUri: window.location.origin + `/${locale}`,
      locale: locale,
    });
  };

  const logout = () => {
    // Clean up interval before logging out
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    keycloak?.logout({
      redirectUri: window.location.origin + `/${locale}/auth/login`,
    });
  };

  const register = () => {
    const detectedLocale = detectBrowserLocale();
    saveStoredLocale(detectedLocale);
    setIsNewRegistration(true);

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
        login,
        logout,
        register,
      }}>
      {loading ? (
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
