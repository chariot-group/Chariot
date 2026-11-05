import { env, keycloakBase, type Role } from "@/env";

async function postForm(url: string, form: Record<string, string>): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form),
  });
}

/** Token utilisateur via password grant (client public `chariot-app`, direct access activé). */
export async function getUserAccessToken(role: Role): Promise<string> {
  const response = await postForm(`${keycloakBase}/realms/${env.keycloakRealm}/protocol/openid-connect/token`, {
    grant_type: "password",
    client_id: env.keycloakClientId,
    username: env.users[role].username,
    password: env.password,
  });
  if (!response.ok) {
    throw new Error(`Connexion Keycloak impossible pour ${env.users[role].username} (HTTP ${response.status})`);
  }
  const body = (await response.json()) as { access_token: string };
  return body.access_token;
}

async function getAdminToken(): Promise<string> {
  const response = await postForm(`${keycloakBase}/realms/master/protocol/openid-connect/token`, {
    grant_type: "password",
    client_id: "admin-cli",
    username: env.keycloakAdminUser,
    password: env.keycloakAdminPassword,
  });
  if (!response.ok) {
    throw new Error(`Connexion admin Keycloak impossible (HTTP ${response.status}) — vérifier KEYCLOAK_ADMIN_*`);
  }
  const body = (await response.json()) as { access_token: string };
  return body.access_token;
}

/**
 * Crée le compte de test s'il n'existe pas et réinitialise son mot de passe.
 * Idempotent : peut être relancé à chaque exécution.
 */
async function ensureUser(adminToken: string, role: Role): Promise<void> {
  const user = env.users[role];
  const adminBase = `${keycloakBase}/admin/realms/${env.keycloakRealm}`;
  const headers = { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" };

  const search = await fetch(`${adminBase}/users?exact=true&username=${encodeURIComponent(user.username)}`, {
    headers,
  });
  if (!search.ok) throw new Error(`Recherche utilisateur Keycloak impossible (HTTP ${search.status})`);
  const existing = (await search.json()) as Array<{ id: string }>;

  let userId: string | undefined = existing[0]?.id;
  if (!userId) {
    const created = await fetch(`${adminBase}/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        username: user.username,
        email: `${user.username}@e2e.chariot.test`,
        firstName: user.firstName,
        lastName: user.lastName,
        enabled: true,
        emailVerified: true,
        requiredActions: [],
      }),
    });
    if (created.status !== 201) {
      throw new Error(`Création de ${user.username} impossible (HTTP ${created.status})`);
    }
    userId = created.headers.get("location")?.split("/").pop();
    if (!userId) throw new Error(`Identifiant Keycloak introuvable pour ${user.username}`);
  }

  const reset = await fetch(`${adminBase}/users/${userId}/reset-password`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ type: "password", value: env.password, temporary: false }),
  });
  if (!reset.ok) throw new Error(`Mot de passe de ${user.username} non défini (HTTP ${reset.status})`);
}

/** Provisionne tous les comptes de test. Sans identifiants admin, on suppose qu'ils existent déjà. */
export async function ensureTestUsers(): Promise<void> {
  if (!env.keycloakAdminUser || !env.keycloakAdminPassword) return;
  const adminToken = await getAdminToken();
  for (const role of Object.keys(env.users) as Role[]) {
    await ensureUser(adminToken, role);
  }
}
