"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { io } = require("socket.io-client");

function loadDotEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadDotEnv();

const URL_ENV_TO_VAR = {
  GATEWAY_URL: "gatewayUrl",
  SESSION_WS_URL: "sessionWsUrl",
  KEYCLOAK_URL: "keycloakUrl",
  KEYCLOAK_AUTH_PREFIX: "keycloakAuthPrefix",
  KEYCLOAK_REALM: "keycloakRealm",
  KEYCLOAK_CLIENT_ID: "keycloakClientId",
};

function stripTrailingSlash(value) {
  return String(value ?? "").replace(/\/$/, "");
}

function mergeEnvIntoContext(context) {
  for (const [envKey, varKey] of Object.entries(URL_ENV_TO_VAR)) {
    if (process.env[envKey] === undefined) continue;
    context.vars[varKey] = process.env[envKey];
  }
}

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const lib = options.protocol === "https:" ? https : http;
    const req = lib.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        let json = null;
        try {
          json = raw ? JSON.parse(raw) : null;
        } catch {
          json = { raw };
        }
        resolve({ status: res.statusCode ?? 0, json });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function buildKeycloakOidcBase(context) {
  const base = stripTrailingSlash(process.env.KEYCLOAK_URL || context.vars.keycloakUrl || "");
  const prefix = stripTrailingSlash(
    process.env.KEYCLOAK_AUTH_PREFIX || context.vars.keycloakAuthPrefix || "",
  );
  const realm = process.env.KEYCLOAK_REALM || context.vars.keycloakRealm || "chariot";
  return `${base}${prefix}/realms/${realm}`;
}

function gatewayUrl(context) {
  return stripTrailingSlash(process.env.GATEWAY_URL || context.vars.gatewayUrl || "");
}

function gatewayRequestOptions(context, method, pathname, accessToken, bodyStr) {
  const url = new URL(`${gatewayUrl(context)}${pathname}`);
  return {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
    path: `${url.pathname}${url.search}`,
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(bodyStr
        ? {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(bodyStr),
          }
        : {}),
    },
  };
}

async function timedRequest(events, metricName, options, body) {
  const started = Date.now();
  const result = await httpRequest(options, body);
  const ms = Date.now() - started;
  if (events) {
    events.emit("histogram", metricName, ms);
    events.emit("counter", "capacity.http_total", 1);
    if (result.status >= 500) events.emit("counter", "capacity.http_5xx", 1);
  }
  return result;
}

function resourceId(json) {
  return json?.data?.id ?? json?.data?._id ?? null;
}

function manifestPathForRun(runId) {
  return path.join(__dirname, "manifests", `manifest-${runId}.json`);
}

let cachedManifest = null;
let assignIndex = 0;

function loadManifest() {
  const runId = process.env.LOAD_TEST_RUN_ID?.trim();
  if (!runId) {
    throw new Error("LOAD_TEST_RUN_ID requis pour les tests capacité Artillery.");
  }
  if (cachedManifest?.runId === runId) return cachedManifest;
  const file = manifestPathForRun(runId);
  if (!fs.existsSync(file)) {
    throw new Error(`Manifest introuvable : ${file}. Lancez provision + sync-sessions d'abord.`);
  }
  cachedManifest = JSON.parse(fs.readFileSync(file, "utf8"));
  return cachedManifest;
}

function tableLimit() {
  const manifest = loadManifest();
  const fromEnv = Number(process.env.LOAD_TEST_TABLE_LIMIT);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return Math.min(fromEnv, manifest.tables.length);
  }
  return manifest.tables.length;
}

function idleLimit() {
  const manifest = loadManifest();
  const idleUsers = manifest.idleUsers ?? [];
  const fromEnv = Number(process.env.LOAD_TEST_IDLE_LIMIT);
  if (Number.isFinite(fromEnv) && fromEnv >= 0) {
    return Math.min(fromEnv, idleUsers.length);
  }
  return idleUsers.length;
}

function flattenAccounts() {
  const manifest = loadManifest();
  const limit = tableLimit();
  const accounts = [];
  for (const table of manifest.tables.slice(0, limit)) {
    if (!table.sessionCode) {
      throw new Error(
        `Table ${table.index} sans sessionCode. Exécutez npm run capacity:sync-sessions -- --run-id ${manifest.runId}`,
      );
    }
    accounts.push({
      role: "gm",
      tableIndex: table.index,
      sessionCode: table.sessionCode,
      username: table.gm.username,
      keycloakId: table.gm.keycloakId,
    });
    for (const player of table.players) {
      accounts.push({
        role: "player",
        tableIndex: table.index,
        sessionCode: table.sessionCode,
        username: player.username,
        keycloakId: player.keycloakId,
      });
    }
  }
  for (const idle of (manifest.idleUsers ?? []).slice(0, idleLimit())) {
    accounts.push({
      role: "idle",
      username: idle.username,
      keycloakId: idle.keycloakId,
    });
  }
  return { accounts, password: manifest.password, runId: manifest.runId };
}

/** @type {Map<string, { accessToken: string, expiresAtMs: number }>} */
const tokenCache = new Map();
/** @type {Map<string, Promise<string>>} */
const tokenInflight = new Map();

async function requestPasswordGrant(context, username, password) {
  const clientId = process.env.KEYCLOAK_CLIENT_ID || context.vars.keycloakClientId || "chariot-app";
  const tokenUrl = new URL(`${buildKeycloakOidcBase(context)}/protocol/openid-connect/token`);
  const payload = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    username,
    password,
  }).toString();

  const { status, json } = await httpRequest(
    {
      protocol: tokenUrl.protocol,
      hostname: tokenUrl.hostname,
      port: tokenUrl.port,
      path: `${tokenUrl.pathname}${tokenUrl.search}`,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(payload),
      },
    },
    payload,
  );

  if (status !== 200 || !json?.access_token) {
    throw new Error(`Keycloak token HTTP ${status} (${username}): ${JSON.stringify(json)}`);
  }
  const ttlSec = Number(json.expires_in) > 0 ? Number(json.expires_in) : 300;
  return { accessToken: json.access_token, expiresAtMs: Date.now() + ttlSec * 1000 };
}

function fetchAccessTokenForUser(context, username, password) {
  const key = `${buildKeycloakOidcBase(context)}|${username}`;
  const cached = tokenCache.get(key);
  if (cached && cached.expiresAtMs - Date.now() > 30_000) {
    return Promise.resolve(cached.accessToken);
  }
  const pending = tokenInflight.get(key);
  if (pending) return pending;
  const request = requestPasswordGrant(context, username, password)
    .then((result) => {
      tokenCache.set(key, result);
      return result.accessToken;
    })
    .finally(() => tokenInflight.delete(key));
  tokenInflight.set(key, request);
  return request;
}

function sessionWsBaseUrl(context) {
  return stripTrailingSlash(
    process.env.SESSION_WS_URL || context.vars.sessionWsUrl || "https://integ-session.chariot.tools",
  );
}

function openSessionSocket(accessToken, context) {
  const url = `${sessionWsBaseUrl(context)}/session`;
  return new Promise((resolve, reject) => {
    const socket = io(url, {
      path: "/ws",
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnection: false,
      timeout: 15000,
    });
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", (err) => reject(err));
  });
}

function onceSocketEvent(socket, event, timeoutMs = 28000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout en attente de l'événement Socket.IO « ${event} »`));
    }, timeoutMs);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
    socket.once("session:error", (payload) => {
      clearTimeout(timer);
      reject(new Error(payload?.message || "session:error"));
    });
  });
}

function jitterMs() {
  return (15 + Math.random() * 10) * 1000;
}

async function getUserMe(context, accessToken, events) {
  const { status, json } = await timedRequest(
    events,
    "capacity.user_me",
    gatewayRequestOptions(context, "GET", "/api/user/me", accessToken),
  );
  if (status !== 200) {
    throw new Error(`GET /api/user/me HTTP ${status}: ${JSON.stringify(json)}`);
  }
}

function minimalPlayerPayload(firstname) {
  return {
    firstname,
    groups: [],
    stats: { senses: [], size: "Medium" },
    affinities: { resistances: [], immunities: [], vulnerabilities: [] },
    abilities: [],
    actions: [],
    spellcasting: [],
    inspiration: false,
    progression: { level: 1, experience: 0 },
    class: [],
    appearance: {},
    background: {},
    treasure: {},
    profile: { race: "", subrace: "", alignment: "True Neutral" },
  };
}

async function createCampaign(context, accessToken, events, runId) {
  const body = JSON.stringify({
    label: `Idle ${runId}`.slice(0, 50),
    groups: { active: [], archived: [] },
  });
  const { status, json } = await timedRequest(
    events,
    "capacity.campaign_write",
    gatewayRequestOptions(context, "POST", "/api/campaigns", accessToken, body),
    body,
  );
  if (status !== 201 && status !== 200) {
    throw new Error(`POST /api/campaigns HTTP ${status}: ${JSON.stringify(json)}`);
  }
  const id = resourceId(json);
  if (!id) throw new Error(`POST /api/campaigns sans id: ${JSON.stringify(json)}`);
  return String(id);
}

async function patchCampaign(context, accessToken, events, campaignId, runId, tick) {
  const body = JSON.stringify({ label: `Idle ${runId} ${tick}`.slice(0, 50) });
  const { status, json } = await timedRequest(
    events,
    "capacity.campaign_write",
    gatewayRequestOptions(context, "PATCH", `/api/campaigns/${campaignId}`, accessToken, body),
    body,
  );
  if (status !== 200) {
    throw new Error(`PATCH /api/campaigns/${campaignId} HTTP ${status}: ${JSON.stringify(json)}`);
  }
}

async function createPlayer(context, accessToken, events, firstname) {
  const body = JSON.stringify(minimalPlayerPayload(firstname));
  const { status, json } = await timedRequest(
    events,
    "capacity.player_write",
    gatewayRequestOptions(context, "POST", "/api/characters/players", accessToken, body),
    body,
  );
  if (status !== 201 && status !== 200) {
    throw new Error(`POST /api/characters/players HTTP ${status}: ${JSON.stringify(json)}`);
  }
  const id = resourceId(json);
  if (!id) throw new Error(`POST /api/characters/players sans id: ${JSON.stringify(json)}`);
  return String(id);
}

async function patchPlayer(context, accessToken, events, playerId, firstname) {
  const body = JSON.stringify({ firstname });
  const { status, json } = await timedRequest(
    events,
    "capacity.player_write",
    gatewayRequestOptions(context, "PATCH", `/api/characters/players/${playerId}`, accessToken, body),
    body,
  );
  if (status !== 200) {
    throw new Error(`PATCH /api/characters/players/${playerId} HTTP ${status}: ${JSON.stringify(json)}`);
  }
}

async function listCampaigns(context, accessToken, events) {
  const { status, json } = await timedRequest(
    events,
    "capacity.campaign_list",
    gatewayRequestOptions(context, "GET", "/api/campaigns?offset=20", accessToken),
  );
  if (status !== 200) {
    throw new Error(`GET /api/campaigns HTTP ${status}: ${JSON.stringify(json)}`);
  }
}

function syncEnvVars(context, events, done) {
  mergeEnvIntoContext(context);
  done();
}

function assignCapacityAccount(context, events, done) {
  try {
    mergeEnvIntoContext(context);
    const { accounts, password } = flattenAccounts();
    const idx = assignIndex++;
    if (idx >= accounts.length) {
      return done(new Error(`Plus de comptes dans le manifest (${accounts.length}) pour le VU #${idx}`));
    }
    const account = accounts[idx];
    context.vars.capacityAccount = account;
    context.vars.loadTestUsername = account.username;
    context.vars.loadTestPassword = password;
    context.vars.sessionCode = account.sessionCode;
    done();
  } catch (err) {
    done(err);
  }
}

async function ensureCapacityAccessToken(context) {
  mergeEnvIntoContext(context);
  const password = context.vars.loadTestPassword || flattenAccounts().password;
  const username = context.vars.loadTestUsername || context.vars.capacityAccount?.username;
  if (!username || !password) {
    throw new Error("Compte capacité non assigné (assignCapacityAccount).");
  }
  context.vars.accessToken = await fetchAccessTokenForUser(context, username, password);
}

async function capacityHeldTableSession(context, events) {
  let socket;
  try {
    mergeEnvIntoContext(context);
    await ensureCapacityAccessToken(context);
    const accessToken = context.vars.accessToken;
    const sessionCode = context.vars.sessionCode;
    const holdSeconds = Number(context.vars.holdSeconds || process.env.LOAD_TEST_HOLD_SECONDS || 150);

    try {
      socket = await openSessionSocket(accessToken, context);
      socket.emit("session:join", { sessionId: sessionCode, characterId: null });
      await onceSocketEvent(socket, "session:joined");
      events?.emit("counter", "capacity.ws_join_ok", 1);
    } catch (err) {
      events?.emit("counter", "capacity.ws_join_fail", 1);
      throw err;
    }

    const endAt = Date.now() + holdSeconds * 1000;
    while (Date.now() < endAt) {
      await getUserMe(context, accessToken, events);
      const remaining = endAt - Date.now();
      if (remaining <= 0) break;
      await new Promise((r) => setTimeout(r, Math.min(jitterMs(), remaining)));
    }

    socket.emit("session:leave", { sessionId: sessionCode });
    await new Promise((r) => setTimeout(r, 400));
  } finally {
    socket?.disconnect();
  }
}

async function capacityIdleWriteSession(context, events) {
  mergeEnvIntoContext(context);
  await ensureCapacityAccessToken(context);
  const accessToken = context.vars.accessToken;
  const holdSeconds = Number(context.vars.holdSeconds || process.env.LOAD_TEST_HOLD_SECONDS || 150);
  const runId = loadManifest().runId;
  let campaignId = null;
  let playerId = null;
  let extraPlayerCreated = false;
  let tick = 0;
  const endAt = Date.now() + holdSeconds * 1000;

  while (Date.now() < endAt) {
    await getUserMe(context, accessToken, events);
    if (!campaignId) {
      campaignId = await createCampaign(context, accessToken, events, runId);
    } else {
      await patchCampaign(context, accessToken, events, campaignId, runId, tick);
    }
    if (!playerId) {
      playerId = await createPlayer(context, accessToken, events, `Idle-${tick}`);
    } else if (!extraPlayerCreated && tick >= 1) {
      await createPlayer(context, accessToken, events, "Idle-extra");
      extraPlayerCreated = true;
    } else {
      await patchPlayer(context, accessToken, events, playerId, `Idle-${tick}`);
    }
    await listCampaigns(context, accessToken, events);
    tick += 1;
    const remaining = endAt - Date.now();
    if (remaining <= 0) break;
    await new Promise((r) => setTimeout(r, Math.min(jitterMs(), remaining)));
  }
}

async function runAssignedRole(context, events) {
  const role = context.vars.capacityAccount?.role;
  if (role === "idle") {
    await capacityIdleWriteSession(context, events);
    return;
  }
  await capacityHeldTableSession(context, events);
}

module.exports = {
  syncEnvVars,
  assignCapacityAccount,
  ensureCapacityAccessToken,
  capacityHeldTableSession,
  capacityIdleWriteSession,
  runAssignedRole,
};
