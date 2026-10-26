#!/usr/bin/env node
import { loadDotEnv } from "./lib/env.mjs";
import { assertIntegTarget } from "./lib/guard.mjs";
import { deleteLoadTestUsersForRun } from "./lib/keycloak-admin.mjs";
import { listAccounts, readManifest, manifestPath } from "./lib/manifest.mjs";
import { gatewayJson, requestPasswordGrant } from "./lib/http.mjs";
import { cleanupAdventureMongo } from "./lib/mongo-cleanup.mjs";
import fs from "fs";

loadDotEnv();

function parseArgs(argv) {
  const args = { force: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--run-id") args.runId = argv[++i];
    else if (argv[i] === "--force") args.force = true;
    else if (argv[i] === "--help" || argv[i] === "-h") args.help = true;
  }
  return args;
}

async function leaveSession(accessToken, code) {
  const { status } = await gatewayJson("POST", `/session/sessions/${code}/leave`, accessToken);
  return status;
}

async function closeSession(accessToken, code) {
  const { status } = await gatewayJson("DELETE", `/session/sessions/${code}`, accessToken);
  return status;
}

async function deleteCampaign(accessToken, campaignId) {
  const { status } = await gatewayJson("DELETE", `/api/campaigns/${campaignId}`, accessToken);
  return status;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.runId) {
    console.log("Usage: node scripts/teardown-run.mjs --run-id <id> [--force]");
    process.exit(args.help ? 0 : 1);
  }

  const file = manifestPath(args.runId);
  if (!fs.existsSync(file)) {
    if (args.force) {
      console.warn(`Manifest absent ; suppression Keycloak loadtest-${args.runId}-* uniquement.`);
      assertIntegTarget("teardown-run");
      const n = await deleteLoadTestUsersForRun(args.runId);
      console.log(`${n} utilisateur(s) Keycloak supprimé(s).`);
      return;
    }
    throw new Error(`Manifest introuvable : ${file}`);
  }

  assertIntegTarget("teardown-run");
  const manifest = readManifest(args.runId);
  const password = manifest.password;
  const accounts = listAccounts(manifest);
  const keycloakIds = accounts.map((a) => a.keycloakId);

  for (const table of manifest.tables) {
    const code = table.sessionCode;
    if (!code) continue;

    for (const player of table.players) {
      try {
        const token = await requestPasswordGrant(player.username, password);
        const status = await leaveSession(token, code);
        console.log(`  leave ${player.username} @ ${code}: HTTP ${status}`);
      } catch (err) {
        console.warn(`  leave ${player.username}: ${err.message}`);
      }
    }

    try {
      const gmToken = await requestPasswordGrant(table.gm.username, password);
      const closeStatus = await closeSession(gmToken, code);
      console.log(`  close ${code}: HTTP ${closeStatus}`);
    } catch (err) {
      console.warn(`  close table ${table.index}: ${err.message}`);
    }

    try {
      const gmToken = await requestPasswordGrant(table.gm.username, password);
      const delStatus = await deleteCampaign(gmToken, table.gm.campaignId);
      console.log(`  delete campaign ${table.gm.campaignId}: HTTP ${delStatus}`);
    } catch (err) {
      console.warn(`  delete campaign table ${table.index}: ${err.message}`);
    }
  }

  for (const idle of manifest.idleUsers ?? []) {
    try {
      const token = await requestPasswordGrant(idle.username, password);
      const { json } = await gatewayJson("GET", "/api/campaigns?offset=50", token);
      const campaigns = Array.isArray(json?.data) ? json.data : [];
      for (const campaign of campaigns) {
        const id = campaign.id ?? campaign._id;
        if (!id) continue;
        const delStatus = await deleteCampaign(token, id);
        console.log(`  delete idle campaign ${id}: HTTP ${delStatus}`);
      }
    } catch (err) {
      console.warn(`  idle ${idle.username}: ${err.message}`);
    }
  }

  let mongoStats = { skipped: true };
  try {
    mongoStats = await cleanupAdventureMongo(keycloakIds);
  } catch (err) {
    console.warn(`Mongo cleanup: ${err.message}`);
  }
  if (!mongoStats.skipped) {
    console.log(
      `Mongo: users=${mongoStats.users} campaigns=${mongoStats.campaigns} characters=${mongoStats.characters}`,
    );
  }

  const deleted = await deleteLoadTestUsersForRun(args.runId);
  console.log(`Keycloak: ${deleted} utilisateur(s) supprimé(s).`);

  fs.unlinkSync(file);
  console.log(`Manifest supprimé : ${file}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
