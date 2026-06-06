"use client";

import Keycloak, { KeycloakInitOptions } from "keycloak-js";
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { setKeycloakInstance } from "@/services/ApiService";

interface KeycloakContextType {
  keycloak: Keycloak | null;
  authenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  token: string | null;
  logout: () => void;
}

const KeycloakContext = createContext<KeycloakContextType>({
  keycloak: null,
  authenticated: false,
  isAdmin: false,
  loading: true,
  token: null,
  logout: () => {},
});

export function useKeycloak() {
  return useContext(KeycloakContext);
}

function hasAdminRole(kc: Keycloak): boolean {
  const realmRoles: string[] = (kc.tokenParsed as Record<string, unknown> | undefined)?.realm_access
    ? ((kc.tokenParsed as Record<string, { roles?: string[] }>).realm_access?.roles ?? [])
    : [];
  return realmRoles.includes("admin");
}

export function KeycloakProvider({ children }: { children: ReactNode }) {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initKeycloak = async () => {
      const kc = new Keycloak({
        url: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? "http://localhost:8080",
        realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "chariot",
        clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "chariot-app",
      });

      try {
        const initOptions: KeycloakInitOptions = {
          onLoad: "login-required",
          checkLoginIframe: false,
          pkceMethod: "S256",
        };

        const auth = await kc.init(initOptions);
        const admin = auth ? hasAdminRole(kc) : false;

        if (auth && !admin) {
          // Authenticated but not admin — show access denied then logout
          setKeycloak(kc);
          setAuthenticated(true);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setKeycloak(kc);
        setAuthenticated(auth);
        setIsAdmin(admin);
        setToken(kc.token ?? null);

        if (auth) {
          setKeycloakInstance(kc);

          refreshIntervalRef.current = setInterval(async () => {
            try {
              const refreshed = await kc.updateToken(70);
              if (refreshed) setToken(kc.token ?? null);
            } catch {
              kc.logout();
            }
          }, 60_000);
        }
      } catch (err) {
        console.error("Keycloak init failed", err);
      } finally {
        setLoading(false);
      }
    };

    initKeycloak();

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  const logout = () => keycloak?.logout();

  return (
    <KeycloakContext.Provider value={{ keycloak, authenticated, isAdmin, loading, token, logout }}>
      {children}
    </KeycloakContext.Provider>
  );
}
