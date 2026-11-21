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
  /** `all` : trace, vidéo et captures pour chaque test. Par défaut, uniquement en cas d'échec. */
  artifacts: process.env.E2E_ARTIFACTS?.trim() === "all" ? ("all" as const) : ("failures" as const),
  /**
   * `1` : un `stripe listen` relaie les webhooks Stripe vers la gateway (`make stripe-listen`).
   * Sans lui, aucun paiement n'est confirmé côté Chariot : les scénarios boutique qui attendent
   * un crédit de tokens ou la consommation d'une réduction sont sautés.
   */
  stripeWebhook: process.env.E2E_STRIPE_WEBHOOK?.trim() === "1",
  /**
   * Accès direct au service adventure (sans la gateway, qui retire les en-têtes internes) et son secret
   * inter-services : servent uniquement à créditer des wheels aux comptes de test en local (`creditWheels`).
   * Sans secret, les scénarios qui lancent une session sont sautés quand le solde manque.
   */
  adventureUrl: stripTrailingSlash(read("ADVENTURE_URL", "http://localhost:9000")),
  internalServiceSecret: process.env.INTERNAL_SERVICE_SECRET?.trim() ?? "",
};

/** Identifiants admin Keycloak fournis : provisioning et comptes jetables possibles (stack locale). */
export function hasKeycloakAdmin(): boolean {
  return !!env.keycloakAdminUser && !!env.keycloakAdminPassword;
}

/**
 * Nombre de workers Playwright (`E2E_WORKERS`, 4 par défaut).
 * Chaque worker a sa propre paire de comptes MJ / joueur (cf. `testUser`) : deux tests simultanés
 * ne partagent jamais un compte (sessions WS, roster, page d'atterrissage).
 * Sans admin Keycloak, impossible de créer ces comptes : exécution séquentielle sur les comptes de base.
 */
export const workerCount: number = (() => {
  if (!hasKeycloakAdmin()) return 1;
  const raw = process.env.E2E_WORKERS?.trim();
  const value = raw ? Number(raw) : 4;
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`E2E_WORKERS invalide : « ${raw} » (entier ≥ 1 attendu)`);
  }
  return value;
})();

/** Indices de comptes provisionnés : un par worker. */
export const accountSlots: readonly number[] = Array.from({ length: workerCount }, (_, slot) => slot);

/**
 * Indice du compte d'un test = `testInfo.parallelIndex` (0 … workers-1, stable par worker).
 * Garde-fou si `--workers` est passé en CLI au-delà des comptes provisionnés.
 */
export function accountSlot(parallelIndex: number): number {
  if (parallelIndex >= workerCount) {
    throw new Error(
      `Worker ${parallelIndex} sans compte de test (${workerCount} provisionnés) : utiliser E2E_WORKERS plutôt que --workers`,
    );
  }
  return parallelIndex;
}

export type TestUser = { username: string; email: string; firstName: string; lastName: string };

/**
 * Compte de test d'un rôle pour un worker. Avec un seul worker, les comptes de base
 * (`e2e-gm`, `e2e-player`) ; sinon suffixés par worker (`e2e-gm-0`, `e2e-gm-1`…).
 */
export function testUser(role: Role, slot: number): TestUser {
  const base = env.users[role];
  const username = workerCount === 1 ? base.username : `${base.username}-${slot}`;
  return { username, email: `${username}@e2e.chariot.test`, firstName: base.firstName, lastName: base.lastName };
}

/** Base Keycloak (avec préfixe `/auth` en dev Docker local). */
export const keycloakBase = `${env.keycloakUrl}${env.keycloakAuthPrefix}`;

/** Fichier storageState (cookies SSO + localStorage) d'un compte de test authentifié. */
export function storageStatePath(role: Role, slot: number): string {
  return path.join(rootDir, ".auth", `${role}-${slot}.json`);
}

/** Préfixe des données créées par les scénarios, pour les repérer et les nettoyer. */
export const E2E_PREFIX = "[e2e]";

export function uniqueLabel(label: string): string {
  // Suffixe aléatoire : deux workers peuvent appeler `Date.now()` dans la même milliseconde.
  return `${E2E_PREFIX} ${label} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
