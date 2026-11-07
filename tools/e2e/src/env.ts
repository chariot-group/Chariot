import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

dotenv.config({ path: path.join(rootDir, ".env"), quiet: true });

function read(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Variable d'environnement manquante : ${name} (voir tools/e2e/env.example)`);
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export type Role = "gm" | "player";

export const env = {
  rootDir,
  webUrl: stripTrailingSlash(read("WEB_URL", "http://localhost:3000")),
  gatewayUrl: stripTrailingSlash(read("GATEWAY_URL", "http://localhost:8082")),
  keycloakUrl: stripTrailingSlash(read("KEYCLOAK_URL", "http://localhost:8080")),
  keycloakAuthPrefix: process.env.KEYCLOAK_AUTH_PREFIX?.trim() ?? "/auth",
  keycloakRealm: read("KEYCLOAK_REALM", "chariot"),
  keycloakClientId: read("KEYCLOAK_CLIENT_ID", "chariot-app"),
  keycloakAdminUser: process.env.KEYCLOAK_ADMIN_USER?.trim() ?? "",
  keycloakAdminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD?.trim() ?? "",
  locale: read("LOCALE", "fr"),
  users: {
    gm: { username: read("E2E_GM_USERNAME", "e2e-gm"), firstName: "E2E", lastName: "MJ" },
    player: { username: read("E2E_PLAYER_USERNAME", "e2e-player"), firstName: "E2E", lastName: "Joueur" },
  } satisfies Record<Role, { username: string; firstName: string; lastName: string }>,
  password: read("E2E_USER_PASSWORD", "e2e-Chariot-dev-1!"),
};

/** Base Keycloak (avec préfixe `/auth` en dev Docker local). */
export const keycloakBase = `${env.keycloakUrl}${env.keycloakAuthPrefix}`;

/** Fichier storageState (cookies SSO + localStorage) d'un rôle authentifié. */
export function storageStatePath(role: Role): string {
  return path.join(rootDir, ".auth", `${role}.json`);
}

/** Préfixe des données créées par les scénarios, pour les repérer et les nettoyer. */
export const E2E_PREFIX = "[e2e]";

export function uniqueLabel(label: string): string {
  return `${E2E_PREFIX} ${label} ${Date.now().toString(36)}`;
}
