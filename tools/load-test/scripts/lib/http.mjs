import http from "http";
import https from "https";
import { keycloakOidcTokenUrl } from "./env.mjs";

export function httpRequest(options, body) {
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
        resolve({ status: res.statusCode ?? 0, json, raw });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

export async function requestPasswordGrant(username, password) {
  const clientId = process.env.KEYCLOAK_CLIENT_ID || "chariot-app";
  const tokenUrl = new URL(keycloakOidcTokenUrl());

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
    throw new Error(`Keycloak token HTTP ${status}: ${JSON.stringify(json)}`);
  }
  return json.access_token;
}

export async function gatewayJson(method, path, accessToken, body) {
  const base = new URL(process.env.GATEWAY_URL);
  const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;
  const { status, json } = await httpRequest(
    {
      protocol: base.protocol,
      hostname: base.hostname,
      port: base.port,
      path: `${base.pathname.replace(/\/$/, "")}${path}`,
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
    },
    bodyStr,
  );
  return { status, json };
}
