#!/usr/bin/env node
import crypto from "crypto";
import { loadDotEnv } from "./lib/env.mjs";
import { assertIntegTarget } from "./lib/guard.mjs";
import { createLoadTestUser } from "./lib/keycloak-admin.mjs";
import {
  playersCountForTable,
  writeManifest,
  manifestPath,
} from "./lib/manifest.mjs";
import { gatewayJson, requestPasswordGrant } from "./lib/http.mjs";
import { mapPool } from "./lib/pool.mjs";
import fs from "fs";

loadDotEnv();

function parseArgs(argv) {
  const args = { tables: 1, idle: 0, profile: "many-small" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--run-id") args.runId = argv[++i];
    else if (a === "--profile") args.profile = argv[++i];
    else if (a === "--tables") args.tables = Number(argv[++i]);
    else if (a === "--idle") args.idle = Number(argv[++i]);
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/provision-run.mjs --run-id <id> --profile <many-small|few-large|mixed-realistic> [--tables N] [--idle N]

Profiles:
  many-small       2 PJs par table (min)
  few-large        8 PJs par table (max)
  mixed-realistic  3–8 PJs par table (tirage à la provision)

--idle N           comptes hors session (création/modif campagnes + PJ)
`);
}

async function createCampaign(accessToken, runId, tableIndex) {
  const label = `LoadTest ${runId} T${tableIndex}`.slice(0, 50);
  const { status, json } = await gatewayJson("POST", "/api/campaigns", accessToken, {
    label,
    groups: { active: [], archived: [] },
  });
  if (status !== 201 && status !== 200) {
    throw new Error(`Création campagne HTTP ${status}: ${JSON.stringify(json)}`);
  }
  const campaignId = json?.data?.id ?? json?.data?._id;
  if (!campaignId) {
    throw new Error(`Réponse campagne sans id: ${JSON.stringify(json)}`);
  }
  return String(campaignId);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.runId) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const validProfiles = ["many-small", "few-large", "mixed-realistic"];
  if (!validProfiles.includes(args.profile)) {
    throw new Error(`Profil invalide: ${args.profile}. Attendu: ${validProfiles.join(", ")}`);
  }
  if (!Number.isFinite(args.tables) || args.tables < 1) {
    throw new Error("--tables doit être un entier >= 1");
  }
  if (!Number.isFinite(args.idle) || args.idle < 0) {
    throw new Error("--idle doit être un entier >= 0");
  }

  assertIntegTarget("provision-run");

  const existing = manifestPath(args.runId);
  if (fs.existsSync(existing)) {
    throw new Error(`Manifest déjà présent (${existing}). Teardown d'abord ou choisir un autre --run-id.`);
  }

  const password = crypto.randomBytes(18).toString("base64url");
  const tables = [];

  console.log(
    `Provision runId=${args.runId} profile=${args.profile} tables=${args.tables} idle=${args.idle}`,
  );

  for (let i = 0; i < args.tables; i++) {
    const playersCount = playersCountForTable(args.profile, i);
    const gm = await createLoadTestUser({
      runId: args.runId,
      tableIndex: i,
      role: "gm",
      password,
    });

    const gmToken = await requestPasswordGrant(gm.username, password);
    const campaignId = await createCampaign(gmToken, args.runId, i);

    const players = await mapPool(
      Array.from({ length: playersCount }, (_, p) => p),
      4,
      async (p) =>
        createLoadTestUser({
          runId: args.runId,
          tableIndex: i,
          role: "player",
          playerIndex: p,
          password,
        }),
    );

    tables.push({
      index: i,
      playersCount,
      sessionCode: null,
      gm: { ...gm, campaignId },
      players,
    });
    console.log(`  table ${i}: GM + ${playersCount} PJs (campaign ${campaignId})`);
  }

  const idleUsers = await mapPool(
    Array.from({ length: args.idle }, (_, i) => i),
    4,
    async (i) =>
      createLoadTestUser({
        runId: args.runId,
        role: "idle",
        idleIndex: i,
        password,
      }),
  );
  if (args.idle > 0) {
    console.log(`  ${idleUsers.length} users hors session`);
  }

  const manifest = {
    runId: args.runId,
    profile: args.profile,
    password,
    createdAt: new Date().toISOString(),
    tables,
    idleUsers,
  };

  const file = writeManifest(manifest);
  const users = tables.reduce((n, t) => n + 1 + t.players.length, 0) + idleUsers.length;
  console.log(`Manifest écrit : ${file} (${users} comptes, mot de passe dans le manifest)`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
