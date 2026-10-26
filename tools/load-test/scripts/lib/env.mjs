import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const LOAD_TEST_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function getLoadTestRoot() {
  return LOAD_TEST_ROOT;
}

/** Charge tools/load-test/.env (prioritaire sur le shell). */
export function loadDotEnv() {
  const envPath = path.join(LOAD_TEST_ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

export function stripTrailingSlash(value) {
  return String(value ?? "").replace(/\/$/, "");
}

export function keycloakPublicBaseUrl() {
  const base = stripTrailingSlash(process.env.KEYCLOAK_URL || "");
  const prefix = stripTrailingSlash(process.env.KEYCLOAK_AUTH_PREFIX || "");
  return `${base}${prefix}`;
}

export function keycloakOidcTokenUrl() {
  const realm = process.env.KEYCLOAK_REALM || "chariot";
  return `${keycloakPublicBaseUrl()}/realms/${realm}/protocol/openid-connect/token`;
}

export function gatewayUrl() {
  return stripTrailingSlash(process.env.GATEWAY_URL || "");
}
