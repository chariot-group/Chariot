"use client";

import Keycloak, { KeycloakInitOptions } from "keycloak-js";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { setKeycloakTokenGetter, setKeycloakInstance } from "@/services/apiConfig";

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
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";

  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const initKeycloak = async () => {
      const keycloakConfig = {
        url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080",
        realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "chariot",
        clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "chariot-app",
      };

      const kc = new Keycloak(keycloakConfig);

      try {
        // Enable iframe checks only in production (or when explicitly enabled)
        const shouldCheckIframe = process.env.NODE_ENV === "production";

        const initOptions: KeycloakInitOptions = {
          onLoad: "check-sso",
          checkLoginIframe: shouldCheckIframe,
          pkceMethod: "S256",
        };

        if (shouldCheckIframe) {
          initOptions.silentCheckSsoRedirectUri = window.location.origin + "/silent-check-sso.html";
        }

        let authenticated = false;

        try {
          authenticated = await kc.init(initOptions);
        } catch (initErr) {
          console.warn("Keycloak init failed (first attempt):", initErr);
          // Fallback: disable iframe and require login to avoid silent-check iframe timeouts in dev-like envs
          try {
            const fallbackOptions: KeycloakInitOptions = {
              onLoad: "login-required",
              checkLoginIframe: false,
              pkceMethod: "S256",
            };
            authenticated = await kc.init(fallbackOptions);
          } catch (fallbackErr) {
            console.error("Keycloak init fallback also failed:", fallbackErr);
            // let authenticated remain false; we still set up kc so we can call login manually
          }
        }

        // Common setup regardless of init success
        setKeycloak(kc);
        setAuthenticated(Boolean(authenticated));
        setToken(kc.token || null);

        // Configurer le token getter pour apiClient - utiliser une fonction qui accède toujours au dernier token
        setKeycloakTokenGetter(() => kc.token || null);
        // Passer l'instance Keycloak pour la gestion des 401
        setKeycloakInstance(kc);

        // Configurer le rafraîchissement automatique du token
        if (authenticated) {
          const minValidity = 30;
          setInterval(() => {
            kc.updateToken(minValidity)
              .then((refreshed) => {
                if (refreshed) {
                  setToken(kc.token || null);
                }
              })
              .catch(() => {
                console.error("Failed to refresh token");
                setAuthenticated(false);
                setToken(null);
                kc.login();
              });
          }, 10000);
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to initialize Keycloak (unexpected):", error);
        setLoading(false);
      }
    };

    initKeycloak();
  }, []);

  useEffect(() => {
    if (loading || !keycloak) return;

    // Si l'utilisateur n'est pas authentifié, rediriger vers le login immédiatement
    if (!authenticated) {
      keycloak.login({
        redirectUri: window.location.origin + `/${locale}`,
        locale: locale,
      });
    }
  }, [authenticated, loading, keycloak, locale]);

  const login = () => {
    keycloak?.login({
      redirectUri: window.location.origin + `/${locale}`,
      locale: locale,
    });
  };

  const logout = () => {
    keycloak?.logout({
      redirectUri: window.location.origin + `/${locale}/auth/login`,
    });
  };

  const register = () => {
    keycloak?.register({
      redirectUri: window.location.origin + `/${locale}`,
      locale: locale,
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
      {children}
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
