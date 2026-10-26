#!/usr/bin/env node
/**
 * Smoke capacité : 1 table, 2 PJs, 1 idle write, sync, palier court, teardown.
 * Nécessite .env integ + KEYCLOAK_ADMIN_* remplis.
 */
import { spawnSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { classifyPalier } from "./lib/classify-palier.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runId = `smoke-${crypto.randomBytes(4).toString("hex")}`;

function run(nodeArgs) {
  const result = spawnSync(process.execPath, nodeArgs, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Smoke capacité runId=${runId}`);
let palierFailed = false;
try {
  run([
    "scripts/provision-run.mjs",
    "--run-id",
    runId,
    "--profile",
    "many-small",
    "--tables",
    "1",
    "--idle",
    "1",
  ]);
  run(["scripts/sync-table-sessions.mjs", "--run-id", runId]);
  run([
    "scripts/run-capacity-artillery.mjs",
    "--run-id",
    runId,
    "--tables",
    "1",
    "--idle",
    "1",
    "--hold-seconds",
    "20",
    "--report",
  ]);
  const reportPath = path.join(root, "reports", `capacity-${runId}-t1-i1.json`);
  const report = fs.existsSync(reportPath)
    ? JSON.parse(fs.readFileSync(reportPath, "utf8"))
    : null;
  const classified = classifyPalier(report);
  if (classified.verdict === "red" || (classified.metrics.failed ?? 0) > 0) {
    palierFailed = true;
    console.error(`Smoke palier rouge : ${classified.reasons.join("; ") || "VU failed"}`);
  } else {
    console.log("Smoke capacité OK (provision + sync + palier court).");
  }
} finally {
  run(["scripts/teardown-run.mjs", "--run-id", runId, "--force"]);
}
if (palierFailed) process.exit(1);
