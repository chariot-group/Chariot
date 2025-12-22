"use client";

import Keycloak, { KeycloakInitOptions } from "keycloak-js";
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { setKeycloakInstance } from "@/services/apiConfig";

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

  // Ref pour stocker l'interval ID
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initKeycloak = async () => {
      const keycloakConfig = {
        url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080",
        realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "chariot",
        clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "chariot-app",
      };

      console.log("🔐 Initializing Keycloak with config:", keycloakConfig);

      const kc = new Keycloak(keycloakConfig);

      try {
        const initOptions: KeycloakInitOptions = {
          onLoad: "check-sso",
          checkLoginIframe: false, // Désactiver pour éviter les problèmes d'iframe
          pkceMethod: "S256",
        };

        const authenticated = await kc.init(initOptions);

        console.log("✅ Keycloak initialized:", {
          authenticated,
          hasToken: !!kc.token,
          tokenPreview: kc.token,
        });

        setKeycloak(kc);
        setAuthenticated(authenticated);
        setToken(kc.token || null);

        // Passer l'instance Keycloak à apiClient
        setKeycloakInstance(kc);

        // Configurer le rafraîchissement automatique seulement si authentifié
        if (authenticated && kc.token) {
          // Nettoyer l'ancien interval s'il existe
          if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
          }

          // Configurer un nouveau refresh automatique
          refreshIntervalRef.current = setInterval(() => {
            kc.updateToken(70) // Refresh si expire dans moins de 70 secondes
              .then((refreshed) => {
                if (refreshed) {
                  console.log("🔄 Token auto-refreshed");
                  setToken(kc.token || null);
                }
              })
              .catch((err) => {
                console.error("❌ Failed to refresh token:", err);
                setAuthenticated(false);
                setToken(null);
                kc.login();
              });
          }, 60000); // Vérifier toutes les 60 secondes
        }

        setLoading(false);
      } catch (error) {
        console.error("❌ Failed to initialize Keycloak:", error);
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

    if (!authenticated) {
      console.log("🔓 Not authenticated, redirecting to login");
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
    // Nettoyer l'interval avant de se déconnecter
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

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
