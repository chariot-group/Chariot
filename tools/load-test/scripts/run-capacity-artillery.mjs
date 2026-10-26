#!/usr/bin/env node
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadDotEnv } from "./lib/env.mjs";
import { assertIntegTarget } from "./lib/guard.mjs";
import { readManifest, sessionUserCount } from "./lib/manifest.mjs";
import { gatewayUrl } from "./lib/env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

loadDotEnv();

export function parseArgs(argv) {
  const args = { holdSeconds: 150, report: false, idle: 0 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--run-id") args.runId = argv[++i];
    else if (a === "--tables") args.tables = Number(argv[++i]);
    else if (a === "--idle") args.idle = Number(argv[++i]);
    else if (a === "--hold-seconds") args.holdSeconds = Number(argv[++i]);
    else if (a === "--report") args.report = true;
    else if (a === "--output") args.output = argv[++i];
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
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
    sessionWsUrl: "${process.env.SESSION_WS_URL || "https://integ-session.chariot.tools"}"
    holdSeconds: ${holdSeconds}
  phases:
    - name: ramp
      duration: ${rampSeconds}
      arrivalRate: 1
      maxVusers: ${userCount}
scenarios:
  - name: Capacity — table WS ou idle write
    flow:
      - function: "syncEnvVars"
      - function: "assignCapacityAccount"
      - function: "runAssignedRole"
`;
  fs.writeFileSync(outPath, content, "utf8");
  return outPath;
}

export function runCapacityPalier({
  runId,
  tables,
  idle = 0,
  holdSeconds = 150,
  report = true,
  output,
}) {
  assertIntegTarget("capacity-artillery");
  const manifest = readManifest(runId);
  if (tables < 1 || tables > manifest.tables.length) {
    throw new Error(`--tables doit être entre 1 et ${manifest.tables.length}`);
  }
  const idleAvailable = manifest.idleUsers?.length ?? 0;
  if (idle < 0 || idle > idleAvailable) {
    throw new Error(`--idle doit être entre 0 et ${idleAvailable}`);
  }

  for (const table of manifest.tables.slice(0, tables)) {
    if (!table.sessionCode) {
      throw new Error(
        `Table ${table.index} sans sessionCode. npm run capacity:sync-sessions -- --run-id ${runId}`,
      );
    }
  }

  const userCount = sessionUserCount(manifest, tables) + idle;
  const rampSeconds = Math.max(1, userCount);
  const wallSeconds = rampSeconds + holdSeconds;
  const configPath = writeGeneratedConfig({ userCount, rampSeconds, holdSeconds });

  console.log(
    `Capacité runId=${runId} profile=${manifest.profile} tables=${tables} idle=${idle} users=${userCount} ramp=${rampSeconds}s hold=${holdSeconds}s (total ~${wallSeconds}s)`,
  );

  const env = {
    ...process.env,
    LOAD_TEST_RUN_ID: runId,
    LOAD_TEST_TABLE_LIMIT: String(tables),
    LOAD_TEST_IDLE_LIMIT: String(idle),
    LOAD_TEST_HOLD_SECONDS: String(holdSeconds),
  };

  const reportPath =
    output ||
    path.join(root, "reports", `capacity-${runId}-t${tables}-i${idle}.json`);
  const artilleryArgs = ["run", configPath];
  if (report) {
    fs.mkdirSync(path.join(root, "reports"), { recursive: true });
    artilleryArgs.push("--output", reportPath);
  }

  const result = spawnSync("npx", ["artillery", ...artilleryArgs], {
    cwd: root,
    env,
    stdio: "inherit",
  });

  if (report) {
    console.log(`Rapport : ${reportPath}`);
  }

  return {
    status: result.status ?? 1,
    reportPath: report ? reportPath : null,
    userCount,
    rampSeconds,
    holdSeconds,
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.runId || !args.tables) {
    console.log(`Usage:
  node scripts/run-capacity-artillery.mjs --run-id <id> --tables <N> [--idle N] [--hold-seconds 150] [--report]

  --tables N   N premières tables du manifest (palier).
  --idle N     N premiers users hors session (écriture campagnes/PJ).
  --report     écrit reports/capacity-<runId>-t<N>-i<M>.json
`);
    process.exit(args.help ? 0 : 1);
  }

  const result = runCapacityPalier({
    runId: args.runId,
    tables: args.tables,
    idle: args.idle || 0,
    holdSeconds: args.holdSeconds,
    report: args.report,
    output: args.output,
  });
  process.exit(result.status);
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main();
}
