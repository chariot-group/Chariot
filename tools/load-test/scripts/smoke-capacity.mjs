#!/usr/bin/env node
/**
 * Smoke capacité : 1 table, 2 PJs (many-small), sync sessions, teardown.
 * Nécessite .env integ + KEYCLOAK_ADMIN_* remplis.
 */
import { spawnSync } from "child_process";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runId = `smoke-${crypto.randomBytes(4).toString("hex")}`;

function run(nodeArgs) {
  const result = spawnSync(process.execPath, nodeArgs, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Smoke capacité runId=${runId}`);
try {
  run(["scripts/provision-run.mjs", "--run-id", runId, "--profile", "many-small", "--tables", "1"]);
  run(["scripts/sync-table-sessions.mjs", "--run-id", runId]);
  console.log("Smoke capacité OK (provision + sync).");
} finally {
  run(["scripts/teardown-run.mjs", "--run-id", runId]);
}
