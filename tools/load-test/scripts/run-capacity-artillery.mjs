#!/usr/bin/env node
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadDotEnv } from "./lib/env.mjs";
import { assertIntegTarget } from "./lib/guard.mjs";
import { readManifest } from "./lib/manifest.mjs";
import { gatewayUrl } from "./lib/env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

loadDotEnv();

function parseArgs(argv) {
  const args = { holdSeconds: 150, report: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--run-id") args.runId = argv[++i];
    else if (a === "--tables") args.tables = Number(argv[++i]);
    else if (a === "--hold-seconds") args.holdSeconds = Number(argv[++i]);
    else if (a === "--report") args.report = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function usersForTableLimit(manifest, tableLimit) {
  const slice = manifest.tables.slice(0, tableLimit);
  return slice.reduce((n, t) => n + 1 + t.players.length, 0);
}

function writeGeneratedConfig({ userCount, rampSeconds, holdSeconds }) {
  const outPath = path.join(root, "profiles", ".capacity-generated.yml");
  const gw = gatewayUrl();
  const content = `# Généré par run-capacity-artillery.mjs — ne pas committer
config:
  target: "${gw}"
  processor: "../capacity-processor.cjs"
  http:
    timeout: 30
    defaults:
      headers:
        accept-encoding: "gzip, deflate, br"
  plugins:
    expect: {}
  variables:
    gatewayUrl: "${gw}"
    sessionWsUrl: "${process.env.SESSION_WS_URL || "https://integ.session.chariot.tools"}"
    holdSeconds: ${holdSeconds}
    pollSeconds: 20
  phases:
    - name: ramp
      duration: ${rampSeconds}
      arrivalRate: 1
      maxVusers: ${userCount}
    - name: hold
      duration: ${holdSeconds}
      arrivalRate: 0
      maxVusers: ${userCount}
scenarios:
  - name: Table — join WS, /api/user/me, leave
    flow:
      - function: "syncEnvVars"
      - function: "assignCapacityAccount"
      - function: "capacityHeldTableSession"
`;
  fs.writeFileSync(outPath, content, "utf8");
  return outPath;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.runId || !args.tables) {
    console.log(`Usage:
  node scripts/run-capacity-artillery.mjs --run-id <id> --tables <N> [--hold-seconds 150] [--report]

  --tables N   utilise les N premières tables du manifest (palier).
  --report     écrit reports/capacity-<runId>-t<N>.json
`);
    process.exit(args.help ? 0 : 1);
  }

  assertIntegTarget("capacity-artillery");
  const manifest = readManifest(args.runId);
  if (args.tables < 1 || args.tables > manifest.tables.length) {
    throw new Error(`--tables doit être entre 1 et ${manifest.tables.length}`);
  }

  for (const table of manifest.tables.slice(0, args.tables)) {
    if (!table.sessionCode) {
      throw new Error(
        `Table ${table.index} sans sessionCode. npm run capacity:sync-sessions -- --run-id ${args.runId}`,
      );
    }
  }

  const userCount = usersForTableLimit(manifest, args.tables);
  const rampSeconds = userCount;
  const holdSeconds = args.holdSeconds;
  const wallSeconds = rampSeconds + holdSeconds;

  const configPath = writeGeneratedConfig({
    userCount,
    rampSeconds,
    holdSeconds,
  });

  console.log(
    `Capacité runId=${args.runId} profile=${manifest.profile} tables=${args.tables} users=${userCount} ramp=${rampSeconds}s hold=${holdSeconds}s (total ~${wallSeconds}s)`,
  );

  const env = {
    ...process.env,
    LOAD_TEST_RUN_ID: args.runId,
    LOAD_TEST_TABLE_LIMIT: String(args.tables),
    LOAD_TEST_HOLD_SECONDS: String(holdSeconds),
  };

  const reportPath = path.join(root, "reports", `capacity-${args.runId}-t${args.tables}.json`);
  // Artillery 2 : un seul worker local par défaut (--count 1). Pas de flag --workers.
  const artilleryArgs = ["run", configPath];
  if (args.report) {
    fs.mkdirSync(path.join(root, "reports"), { recursive: true });
    artilleryArgs.push("--output", reportPath);
  }

  const result = spawnSync("npx", ["artillery", ...artilleryArgs], {
    cwd: root,
    env,
    stdio: "inherit",
  });

  if (args.report) {
    console.log(`Rapport : ${reportPath}`);
  }

  process.exit(result.status ?? 1);
}

main();
