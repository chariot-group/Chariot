#!/usr/bin/env node
import { loadDotEnv } from "./lib/env.mjs";
import { assertIntegTarget } from "./lib/guard.mjs";
import { readManifest, writeManifest } from "./lib/manifest.mjs";
import { gatewayJson, requestPasswordGrant } from "./lib/http.mjs";

loadDotEnv();

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--run-id") args.runId = argv[++i];
    else if (argv[i] === "--help" || argv[i] === "-h") args.help = true;
  }
  return args;
}

async function createSession(accessToken, campaignId) {
  const { status, json } = await gatewayJson("POST", "/session/sessions", accessToken, {
    campaignId,
  });
  if (status !== 201 && status !== 200) {
    throw new Error(`Création session HTTP ${status}: ${JSON.stringify(json)}`);
  }
  const code = json?.data?.code;
  if (!code) {
    throw new Error(`Réponse session sans code: ${JSON.stringify(json)}`);
  }
  return code;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.runId) {
    console.log("Usage: node scripts/sync-table-sessions.mjs --run-id <id>");
    process.exit(args.help ? 0 : 1);
  }

  assertIntegTarget("sync-table-sessions");
  const manifest = readManifest(args.runId);
  const password = manifest.password;

  let created = 0;
  for (const table of manifest.tables) {
    if (table.sessionCode) {
      console.log(`  table ${table.index}: session ${table.sessionCode} (déjà présente)`);
      continue;
    }
    const token = await requestPasswordGrant(table.gm.username, password);
    const code = await createSession(token, table.gm.campaignId);
    table.sessionCode = code;
    created++;
    console.log(`  table ${table.index}: session ${code}`);
  }

  writeManifest(manifest);
  console.log(`Sync terminé (${created} session(s) créée(s)).`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
