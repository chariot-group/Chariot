import { accountSlots, env, hasKeycloakAdmin, keycloakBase, testUser, type Role, type TestUser } from "@/env";

export { hasKeycloakAdmin };

async function postForm(url: string, form: Record<string, string>): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form),
  });
}

/** Token d'un compte de test via password grant (client public `chariot-app`, direct access activé). */
export async function getUserAccessToken(role: Role, slot: number): Promise<string> {
  const { username } = testUser(role, slot);
  const response = await postForm(`${keycloakBase}/realms/${env.keycloakRealm}/protocol/openid-connect/token`, {
    grant_type: "password",
    client_id: env.keycloakClientId,
    username,
    password: env.password,
  });
  if (!response.ok) {
    throw new Error(`Connexion Keycloak impossible pour ${username} (HTTP ${response.status})`);
  }
  const body = (await response.json()) as { access_token: string };
  return body.access_token;
}

/** Token admin mis en cache par worker, renouvelé 10 s avant expiration. */
let cachedAdminToken: { value: string; expiresAt: number } | undefined;

async function getAdminToken(): Promise<string> {
  if (cachedAdminToken && Date.now() < cachedAdminToken.expiresAt) return cachedAdminToken.value;
  const response = await postForm(`${keycloakBase}/realms/master/protocol/openid-connect/token`, {
    grant_type: "password",
    client_id: "admin-cli",
    username: env.keycloakAdminUser,
    password: env.keycloakAdminPassword,
  });
  if (!response.ok) {
    throw new Error(`Connexion admin Keycloak impossible (HTTP ${response.status}) — vérifier KEYCLOAK_ADMIN_*`);
  }
  const body = (await response.json()) as { access_token: string; expires_in?: number };
  const lifetimeMs = (body.expires_in ?? 60) * 1000;
  cachedAdminToken = { value: body.access_token, expiresAt: Date.now() + lifetimeMs - 10_000 };
  return body.access_token;
}

const adminBase = () => `${keycloakBase}/admin/realms/${env.keycloakRealm}`;

function adminHeaders(adminToken: string): Record<string, string> {
  return { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" };
}

async function findUserId(adminToken: string, username: string): Promise<string | undefined> {
  const search = await fetch(`${adminBase()}/users?exact=true&username=${encodeURIComponent(username)}`, {
    headers: adminHeaders(adminToken),
  });
  if (!search.ok) throw new Error(`Recherche utilisateur Keycloak impossible (HTTP ${search.status})`);
  const existing = (await search.json()) as Array<{ id: string }>;
  return existing[0]?.id;
}

type NewUser = TestUser;

async function createUser(adminToken: string, user: NewUser): Promise<string> {
  // Champs listés un à un : Keycloak refuse (400) tout champ inconnu de UserRepresentation.
  const { username, email, firstName, lastName } = user;
  const created = await fetch(`${adminBase()}/users`, {
    method: "POST",
    headers: adminHeaders(adminToken),
    body: JSON.stringify({
      username,
      email,
      firstName,
      lastName,
      enabled: true,
      emailVerified: true,
      requiredActions: [],
    }),
  });
  if (created.status !== 201) {
    throw new Error(`Création de ${user.username} impossible (HTTP ${created.status})`);
  }
  const userId = created.headers.get("location")?.split("/").pop();
  if (!userId) throw new Error(`Identifiant Keycloak introuvable pour ${user.username}`);
  return userId;
}

async function setPassword(adminToken: string, userId: string, username: string, password: string): Promise<void> {
  const reset = await fetch(`${adminBase()}/users/${userId}/reset-password`, {
    method: "PUT",
    headers: adminHeaders(adminToken),
    body: JSON.stringify({ type: "password", value: password, temporary: false }),
  });
  if (!reset.ok) throw new Error(`Mot de passe de ${username} non défini (HTTP ${reset.status})`);
}

/**
 * Crée le compte de test d'un worker s'il n'existe pas et réinitialise son mot de passe.
 * Idempotent : peut être relancé à chaque exécution. Sans identifiants admin, on suppose qu'il existe.
 */
export async function ensureTestUser(role: Role, slot: number): Promise<void> {
  if (!hasKeycloakAdmin()) return;
  const adminToken = await getAdminToken();
  const user = testUser(role, slot);
  const userId = (await findUserId(adminToken, user.username)) ?? (await createUser(adminToken, user));
  await setPassword(adminToken, userId, user.username, env.password);
}

/** Provisionne les comptes de test de tous les workers. */
export async function ensureTestUsers(): Promise<void> {
  for (const slot of accountSlots) {
    for (const role of Object.keys(env.users) as Role[]) {
      await ensureTestUser(role, slot);
    }
  }
}

/** Compte jetable propre à un scénario : il peut être modifié sans gêner les autres. */
export type TemporaryAccount = NewUser & { password: string };

/** Préfixe des comptes jetables, pour les repérer (et les purger) dans Keycloak. */
export const TEMPORARY_ACCOUNT_PREFIX = "e2e-tmp-";

/** Données uniques d'un compte jetable (rien n'est créé). Identifiant ≤ 30 caractères, minuscules. */
export function temporaryAccountData(tag: string): TemporaryAccount {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const username = `${TEMPORARY_ACCOUNT_PREFIX}${tag}-${suffix}`.toLowerCase();
  return {
    username,
    email: `${username}@e2e.chariot.test`,
    firstName: "Temporaire",
    lastName: "Etedeuxe",
    password: env.password,
  };
}

/** Crée un compte jetable via l'API admin (nécessite `KEYCLOAK_ADMIN_*`). */
export async function createTemporaryAccount(tag: string): Promise<TemporaryAccount> {
  const account = temporaryAccountData(tag);
  const adminToken = await getAdminToken();
  const userId = await createUser(adminToken, account);
  await setPassword(adminToken, userId, account.username, account.password);
  return account;
}

/** Supprime un compte Keycloak par identifiant. Sans effet s'il n'existe pas. */
export async function deleteKeycloakAccount(username: string): Promise<void> {
  const adminToken = await getAdminToken();
  const userId = await findUserId(adminToken, username);
  if (!userId) return;
  const deleted = await fetch(`${adminBase()}/users/${userId}`, {
    method: "DELETE",
    headers: adminHeaders(adminToken),
  });
  if (!deleted.ok) throw new Error(`Suppression de ${username} impossible (HTTP ${deleted.status})`);
}
