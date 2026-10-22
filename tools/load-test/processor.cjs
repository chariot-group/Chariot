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
    // Le fichier .env du dossier load-test prime sur l'environnement shell
    // (évite KEYCLOAK_AUTH_PREFIX=/auth hérité du docker local → 404 sur integ).
    process.env[key] = value;
  }
}

loadDotEnv();

const CREDENTIAL_ENV_TO_VAR = {
  LOAD_TEST_USERNAME: "loadTestUsername",
  LOAD_TEST_PASSWORD: "loadTestPassword",
  LOAD_TEST_CAMPAIGN_ID: "loadTestCampaignId",
};

/** URLs optionnelles dans .env pour pointer vers prod / autre env sans éditer le YAML. */
const URL_ENV_TO_VAR = {
  GATEWAY_URL: "gatewayUrl",
  KEYCLOAK_URL: "keycloakUrl",
  KEYCLOAK_AUTH_PREFIX: "keycloakAuthPrefix",
  KEYCLOAK_REALM: "keycloakRealm",
  KEYCLOAK_CLIENT_ID: "keycloakClientId",
  SESSION_WS_URL: "sessionWsUrl",
  SESSION_HTTP_URL: "sessionHttpUrl",
  PAYMENT_HTTP_URL: "paymentHttpUrl",
  MINIO_PUBLIC_URL: "minioUrl",
  WEB_URL: "webUrl",
};

function buildKeycloakOidcBase(context) {
  const base = stripTrailingSlash(process.env.KEYCLOAK_URL || context.vars.keycloakUrl || "http://localhost:8080");
  const prefix = keycloakAuthPrefix(context);
  const realm = process.env.KEYCLOAK_REALM || context.vars.keycloakRealm || "chariot";
  return `${base}${prefix}/realms/${realm}`;
}

function mergeEnvIntoContext(context) {
  for (const [envKey, varKey] of Object.entries(CREDENTIAL_ENV_TO_VAR)) {
    const value = process.env[envKey];
    if (value !== undefined && value !== "") {
      context.vars[varKey] = value;
    }
  }
  for (const [envKey, varKey] of Object.entries(URL_ENV_TO_VAR)) {
    if (process.env[envKey] === undefined) continue;
    context.vars[varKey] = process.env[envKey];
  }
  context.vars.keycloakOidcBase = buildKeycloakOidcBase(context);
}

/** Premier step de chaque scénario HTTP (Artillery n'appelle pas beforeScenario exporté globalement). */
function syncEnvVars(context, events, done) {
  mergeEnvIntoContext(context);
  done();
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
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function stripTrailingSlash(value) {
  return String(value ?? "").replace(/\/$/, "");
}

/** Aligné avec config.target du YAML (moteur socketio-v3). */
function assertSessionWsTargetMatchesConfig() {
  const fromEnv = process.env.SESSION_WS_URL
    ? stripTrailingSlash(process.env.SESSION_WS_URL)
    : null;
  const expected = "https://integ.session.chariot.tools";
  if (fromEnv && fromEnv !== expected) {
    console.warn(
      `[load-test] SESSION_WS_URL=${fromEnv} diffère de config.target (${expected}). ` +
        "Mettre à jour config.target dans chariot-all-services.yml ou corriger .env.",
    );
  }
}
assertSessionWsTargetMatchesConfig();

function keycloakAuthPrefix(context) {
  if (context.vars.keycloakAuthPrefix !== undefined) {
    return stripTrailingSlash(context.vars.keycloakAuthPrefix);
  }
  if (process.env.KEYCLOAK_AUTH_PREFIX !== undefined && process.env.KEYCLOAK_AUTH_PREFIX !== "") {
    return stripTrailingSlash(process.env.KEYCLOAK_AUTH_PREFIX);
  }
  return "";
}

function keycloakTokenUrl(context) {
  return `${buildKeycloakOidcBase(context)}/protocol/openid-connect/token`;
}

function gatewayUrl(context) {
  return stripTrailingSlash(process.env.GATEWAY_URL || context.vars.gatewayUrl || "http://localhost:8082");
}

/** Marge avant expires_in : un seul refresh, pas une tempête de grants à l'échéance (300 s). */
const TOKEN_REFRESH_SKEW_MS = 30_000;
const DEFAULT_TOKEN_TTL_SEC = 300;

/** @type {Map<string, { accessToken: string, expiresAtMs: number }>} */
const tokenCache = new Map();
/** @type {Map<string, Promise<string>>} */
const tokenInflight = new Map();

function tokenCacheKey(tokenUrl, clientId, username) {
  return `${tokenUrl}|${clientId}|${username}`;
}

async function requestPasswordGrant(context, username, password, clientId) {
  const payload = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    username,
    password,
  }).toString();

  const url = new URL(keycloakTokenUrl(context));
  const { status, json } = await httpRequest(
    {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(payload),
      },
    },
    payload,
  );

  if (status !== 200 || !json?.access_token) {
    throw new Error(`Keycloak token HTTP ${status}: ${JSON.stringify(json)}`);
  }

  const expiresInSec = Number(json.expires_in);
  const ttlSec = Number.isFinite(expiresInSec) && expiresInSec > 0 ? expiresInSec : DEFAULT_TOKEN_TTL_SEC;
  return {
    accessToken: json.access_token,
    expiresAtMs: Date.now() + ttlSec * 1000,
  };
}

/**
 * Un password grant par compte, partagé par tous les VUs du process.
 * Les appels concurrents au refresh attendent la même promesse (single-flight).
 */
function fetchAccessToken(context) {
  const username = process.env.LOAD_TEST_USERNAME || context.vars.loadTestUsername;
  const password = process.env.LOAD_TEST_PASSWORD || context.vars.loadTestPassword;
  const clientId = process.env.KEYCLOAK_CLIENT_ID || context.vars.keycloakClientId || "chariot-app";

  if (!username || !password) {
    return Promise.reject(
      new Error(
        "Définir LOAD_TEST_USERNAME et LOAD_TEST_PASSWORD (ou loadTestUsername / loadTestPassword dans config.variables).",
      ),
    );
  }

  const key = tokenCacheKey(keycloakTokenUrl(context), clientId, username);
  const cached = tokenCache.get(key);
  if (cached && cached.expiresAtMs - Date.now() > TOKEN_REFRESH_SKEW_MS) {
    return Promise.resolve(cached.accessToken);
  }

  const pending = tokenInflight.get(key);
  if (pending) return pending;

  const request = requestPasswordGrant(context, username, password, clientId)
    .then((result) => {
      tokenCache.set(key, result);
      return result.accessToken;
    })
    .finally(() => {
      tokenInflight.delete(key);
    });
  tokenInflight.set(key, request);
  return request;
}

/** Step Artillery : pose context.vars.accessToken sans refaire un grant si le cache est valide. */
async function ensureAccessToken(context) {
  mergeEnvIntoContext(context);
  context.vars.accessToken = await fetchAccessToken(context);
}

async function createSessionCode(context, accessToken) {
  const campaignId = process.env.LOAD_TEST_CAMPAIGN_ID || context.vars.loadTestCampaignId;
  if (!campaignId || campaignId === "REPLACE_WITH_REAL_CAMPAIGN_ID") {
    throw new Error("Définir LOAD_TEST_CAMPAIGN_ID (ou loadTestCampaignId) pour les scénarios session.");
  }

  const url = new URL(`${gatewayUrl(context)}/session/sessions`);
  const body = JSON.stringify({ campaignId });
  const { status, json } = await httpRequest(
    {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    },
    body,
  );

  if (status !== 201 || !json?.data?.code) {
    throw new Error(`Création session HTTP ${status}: ${JSON.stringify(json)}`);
  }

  return json.data.code;
}

async function authenticateUser(context, events) {
  mergeEnvIntoContext(context);
  context.vars.accessToken = await fetchAccessToken(context);
}

/** Prépare token + code OTP pour session:join (REST puis WS). */
async function prepareSessionJoin(context, events) {
  mergeEnvIntoContext(context);
  const accessToken = await fetchAccessToken(context);
  context.vars.accessToken = accessToken;
  context.vars.sessionCode = await createSessionCode(context, accessToken);
}

function sessionWsBaseUrl(context) {
  return stripTrailingSlash(
    process.env.SESSION_WS_URL || context.vars.sessionWsUrl || "https://integ.session.chariot.tools",
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

async function wsSessionCreateAndLeave(context, events) {
  let socket;
  try {
    mergeEnvIntoContext(context);
    const accessToken = context.vars.accessToken || (await fetchAccessToken(context));
    const campaignId = process.env.LOAD_TEST_CAMPAIGN_ID || context.vars.loadTestCampaignId;
    if (!campaignId) {
      throw new Error("Définir LOAD_TEST_CAMPAIGN_ID pour le scénario WebSocket create.");
    }
    socket = await openSessionSocket(accessToken, context);
    socket.emit("session:create", { campaignId });
    const created = await onceSocketEvent(socket, "session:created");
    const sessionCode = created?.session?.code;
    if (!sessionCode) {
      throw new Error(`session:created sans code OTP: ${JSON.stringify(created)}`);
    }
    socket.emit("session:leave", { sessionId: sessionCode });
    await new Promise((resolve) => setTimeout(resolve, 400));
  } finally {
    socket?.disconnect();
  }
}

async function wsSessionJoinAndLeave(context, events) {
  let socket;
  try {
    mergeEnvIntoContext(context);
    const accessToken = context.vars.accessToken || (await fetchAccessToken(context));
    const sessionCode = context.vars.sessionCode;
    if (!sessionCode) {
      throw new Error("sessionCode manquant — beforeScenario prepareSessionJoin requis.");
    }
    socket = await openSessionSocket(accessToken, context);
    socket.emit("session:join", { sessionId: sessionCode, characterId: null });
    await onceSocketEvent(socket, "session:joined");
    socket.emit("session:leave", { sessionId: sessionCode });
    await new Promise((resolve) => setTimeout(resolve, 400));
  } finally {
    socket?.disconnect();
  }
}

module.exports = {
  syncEnvVars,
  ensureAccessToken,
  authenticateUser,
  prepareSessionJoin,
  wsSessionCreateAndLeave,
  wsSessionJoinAndLeave,
};
