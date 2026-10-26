import KcAdminClient from "@keycloak/keycloak-admin-client";
import { keycloakPublicBaseUrl } from "./env.mjs";

function requireAdminCredentials() {
  const username = process.env.KEYCLOAK_ADMIN_USER?.trim();
  const password = process.env.KEYCLOAK_ADMIN_PASSWORD?.trim();
  if (!username || !password) {
    throw new Error(
      "KEYCLOAK_ADMIN_USER et KEYCLOAK_ADMIN_PASSWORD requis dans tools/load-test/.env pour provision/teardown.",
    );
  }
  return { username, password };
}

function createAdminClient() {
  return new KcAdminClient({
    baseUrl: keycloakPublicBaseUrl(),
    realmName: "master",
  });
}

async function authenticate(client) {
  const { username, password } = requireAdminCredentials();
  await client.auth({
    username,
    password,
    grantType: "password",
    clientId: "admin-cli",
  });
}

let sharedAdmin = null;
let sharedAdminAt = 0;

async function getAdminClient() {
  const client = sharedAdmin ?? createAdminClient();
  if (!sharedAdmin || Date.now() - sharedAdminAt > 40_000) {
    await authenticate(client);
    sharedAdminAt = Date.now();
    sharedAdmin = client;
  }
  return client;
}

/**
 * @param {object} params
 * @param {string} params.runId
 * @param {number} [params.tableIndex]
 * @param {'gm'|'player'|'idle'} params.role
 * @param {number} [params.playerIndex]
 * @param {number} [params.idleIndex]
 */
export async function createLoadTestUser({
  runId,
  tableIndex,
  role,
  playerIndex,
  idleIndex,
  password,
}) {
  const client = await getAdminClient();
  const realm = process.env.KEYCLOAK_REALM || "chariot";

  const suffix =
    role === "idle"
      ? `idle${idleIndex}`
      : role === "gm"
        ? `t${tableIndex}-gm`
        : `t${tableIndex}-p${playerIndex}`;
  const username = `loadtest-${runId}-${suffix}`;
  const email = `${username}@loadtest.chariot.invalid`;

  const created = await client.users.create({
    realm,
    username,
    email,
    firstName: "LoadTest",
    lastName: role === "idle" ? `Idle${idleIndex}` : role === "gm" ? "GM" : `P${playerIndex}`,
    enabled: true,
    emailVerified: true,
    attributes: {
      loadTestRunId: [runId],
      loadTestTableIndex: [role === "idle" ? "idle" : String(tableIndex)],
      loadTestRole: [role],
    },
    credentials: [{ type: "password", value: password, temporary: false }],
    realmRoles: ["users"],
  });

  const userId = created.id;
  if (!userId) {
    throw new Error(`Keycloak n'a pas renvoyé d'id pour ${username}`);
  }
  return { username, email, keycloakId: userId };
}

export async function deleteLoadTestUsersForRun(runId) {
  const client = await getAdminClient();
  const realm = process.env.KEYCLOAK_REALM || "chariot";
  const prefix = `loadtest-${runId}-`;

  const users = await client.users.find({ realm, max: 5000 });
  const toDelete = users.filter((u) => u.username?.startsWith(prefix));

  for (const user of toDelete) {
    await client.users.del({ realm, id: user.id });
  }
  return toDelete.length;
}
