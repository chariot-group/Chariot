"use client";

import Keycloak from "keycloak-js";
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
        const authenticated = await kc.init({
          onLoad: "check-sso",
          silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
          checkLoginIframe: false, // Désactivé pour éviter les problèmes CORS en dev
          pkceMethod: "S256",
        });

        setKeycloak(kc);
        setAuthenticated(authenticated);
        setToken(kc.token || null);

        // Configurer le token getter pour apiClient - utiliser une fonction qui accède toujours au dernier token
        setKeycloakTokenGetter(() => kc.token || null);
        // Passer l'instance Keycloak pour la gestion des 401
        setKeycloakInstance(kc);

        // Configurer le rafraîchissement automatique du token
        if (authenticated) {
          // Rafraîchir le token 30 secondes avant expiration
          const minValidity = 30;

          setInterval(() => {
            kc.updateToken(minValidity)
              .then((refreshed) => {
                if (refreshed) {
                  console.log("Token refreshed");
                  setToken(kc.token || null);
                } else {
                  console.log("Token still valid");
                }
              })
              .catch(() => {
                console.error("Failed to refresh token");
                setAuthenticated(false);
                setToken(null);
                kc.login();
              });
          }, 10000); // Vérifier toutes les 10 secondes
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to initialize Keycloak:", error);
        setLoading(false);
      }
    };

    initKeycloak();
  }, []);

  useEffect(() => {
    if (loading || !keycloak) return;

    if (!authenticated) {
      login();
    } else {
      router.push(`/${locale}`);
    }
  }, [authenticated, loading, pathname, router, locale, keycloak]);

  const login = () => {
    keycloak?.login({
      redirectUri: window.location.origin + `/${locale}`,
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
