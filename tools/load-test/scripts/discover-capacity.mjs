#!/usr/bin/env node
/**
 * @see FR-load-test-capacity
 *
 * Une commande : provision → paliers auto → résumé (plafond tables, hors session, mix normal) → teardown.
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadDotEnv, getLoadTestRoot } from "./lib/env.mjs";
import { assertIntegTarget } from "./lib/guard.mjs";
import { manifestPath, readManifest, sessionUserCount } from "./lib/manifest.mjs";
import { classifyPalier } from "./lib/classify-palier.mjs";
import { geometricSteps, binarySearchNext, recommendedOperating } from "./lib/discover-plan.mjs";
import { pjPerTableStats } from "./lib/pj-stats.mjs";
import { formatSummaryMarkdown } from "./lib/summary.mjs";
import { runCapacityPalier } from "./run-capacity-artillery.mjs";

const root = getLoadTestRoot();

loadDotEnv();

function parseArgs(argv) {
  const args = {
    profile: "mixed-realistic",
    maxTables: 40,
    maxIdle: 80,
    idlePerTable: 2,
    holdSeconds: 150,
    startTables: 10,
    idleHoldRatio: 0.5,
    operatingRatio: 0.7,
    keep: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--run-id") args.runId = argv[++i];
    else if (a === "--profile") args.profile = argv[++i];
    else if (a === "--max-tables") args.maxTables = Number(argv[++i]);
    else if (a === "--max-idle") args.maxIdle = Number(argv[++i]);
    else if (a === "--idle-per-table") args.idlePerTable = Number(argv[++i]);
    else if (a === "--hold-seconds") args.holdSeconds = Number(argv[++i]);
    else if (a === "--start-tables") args.startTables = Number(argv[++i]);
    else if (a === "--keep") args.keep = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/discover-capacity.mjs [--run-id ID] [--profile mixed-realistic] [--max-tables 40] [--max-idle 80] [--idle-per-table 2] [--keep]

  Trouve le plafond tables, le plafond hors session (écriture) avec tables, et le mix recommandé.
`);
}

function defaultRunId() {
  return `cap-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}`;
}

function runNode(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${script} exit ${result.status ?? 1}`);
  }
}

function readReport(reportPath) {
  if (!reportPath || !fs.existsSync(reportPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(reportPath, "utf8"));
  } catch {
    return null;
  }
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    usage();
    process.exit(0);
  }
  if (!Number.isFinite(args.maxTables) || args.maxTables < 1) {
    throw new Error("--max-tables doit être >= 1");
  }
  if (!Number.isFinite(args.maxIdle) || args.maxIdle < 0) {
    throw new Error("--max-idle doit être >= 0");
  }

  assertIntegTarget("capacity-discover");

  const runId = args.runId || defaultRunId();
  const summary = {
    runId,
    profile: args.profile,
    createdAt: new Date().toISOString(),
    thresholds: { p95Ms: 1000, http5xxRate: 0.01, wsFailRate: 0.01, vuFailRate: 0.01 },
    paliers: [],
    results: {},
  };

  console.log(`Discover ${runId} profile=${args.profile} max-tables=${args.maxTables} max-idle=${args.maxIdle}`);
  console.log("À la fin : plafond tables (PJ/table), plafond hors session avec tables, mix recommandé.");

  let tornDown = false;
  const teardown = () => {
    if (args.keep || tornDown) return;
    tornDown = true;
    try {
      runNode("scripts/teardown-run.mjs", ["--run-id", runId, "--force"]);
    } catch (err) {
      console.warn(`Teardown : ${err.message}`);
    }
  };

  process.on("SIGINT", () => {
    teardown();
    process.exit(130);
  });

  try {
    if (!fs.existsSync(manifestPath(runId))) {
      runNode("scripts/provision-run.mjs", [
        "--run-id",
        runId,
        "--profile",
        args.profile,
        "--tables",
        String(args.maxTables),
        "--idle",
        String(args.maxIdle),
      ]);
      runNode("scripts/sync-table-sessions.mjs", ["--run-id", runId]);
    } else {
      console.log(`Réutilise le manifest existant : ${manifestPath(runId)}`);
    }

    const manifest = readManifest(runId);
    const idleAvailable = manifest.idleUsers?.length ?? 0;

    const runAt = (tables, idle, name) => {
      const { reportPath, status } = runCapacityPalier({
        runId,
        tables,
        idle,
        holdSeconds: args.holdSeconds,
        report: true,
      });
      const classified = classifyPalier(readReport(reportPath));
      const palier = {
        name,
        n: null,
        tables,
        idle,
        usersInSession: sessionUserCount(manifest, tables),
        pjPerTable: pjPerTableStats(manifest.tables.slice(0, tables)),
        artilleryStatus: status,
        verdict: classified.verdict,
        reasons: classified.reasons,
        metrics: classified.metrics,
        reportPath,
      };
      summary.paliers.push(palier);
      console.log(
        `  → ${classified.verdict.toUpperCase()}${classified.reasons.length ? ` (${classified.reasons.join("; ")})` : ""}`,
      );
      return palier;
    };

    const search = (label, steps, execute) => {
      let lastGreen = null;
      let firstRed = null;
      const tried = new Set();

      const tryN = (n) => {
        if (tried.has(n) || n < 1) return null;
        tried.add(n);
        console.log(`\n[${label}] palier ${n}`);
        const result = execute(n);
        result.n = n;
        if (result.verdict === "green") lastGreen = result;
        else if (firstRed == null) firstRed = n;
        else if (result.verdict === "red") firstRed = Math.min(firstRed, n);
        return result;
      };

      for (const n of steps) {
        const result = tryN(n);
        if (result?.verdict === "red") break;
      }

      if (!lastGreen && firstRed != null && firstRed > 1) tryN(1);

      while (lastGreen && firstRed != null) {
        const mid = binarySearchNext(lastGreen.n, firstRed);
        if (mid == null || tried.has(mid)) break;
        const result = tryN(mid);
        if (result?.verdict === "red") firstRed = mid;
      }

      return lastGreen;
    };

    const tableCeiling = search("tables", geometricSteps(args.maxTables, args.startTables), (n) =>
      runAt(n, 0, `tables-${n}`),
    );
    if (tableCeiling) {
      summary.results.tableCeiling = {
        tables: tableCeiling.tables,
        idle: 0,
        usersInSession: tableCeiling.usersInSession,
        pjPerTable: tableCeiling.pjPerTable,
      };
      console.log(
        `\nPlafond tables : ${tableCeiling.tables} (PJ/table min ${tableCeiling.pjPerTable.min} / méd ${tableCeiling.pjPerTable.median} / max ${tableCeiling.pjPerTable.max})`,
      );
    } else {
      console.log("\nPlafond tables : aucun palier vert.");
    }

    if (tableCeiling && idleAvailable > 0) {
      const heldTables = Math.max(1, Math.floor(tableCeiling.tables * args.idleHoldRatio));
      const idleCeiling = search(
        `idle@${heldTables}tables`,
        geometricSteps(idleAvailable, Math.min(10, idleAvailable)),
        (n) => runAt(heldTables, n, `idle-${n}-t${heldTables}`),
      );
      if (idleCeiling) {
        summary.results.idleWithTablesCeiling = {
          tables: heldTables,
          idle: idleCeiling.idle,
          usersInSession: idleCeiling.usersInSession,
          pjPerTable: idleCeiling.pjPerTable,
        };
        console.log(
          `\nPlafond hors session : ${idleCeiling.idle} users avec ${heldTables} tables`,
        );
      } else {
        console.log("\nPlafond hors session : aucun palier vert.");
      }
    }

    if (tableCeiling && args.idlePerTable > 0 && idleAvailable > 0) {
      const mixMaxTables = Math.min(
        tableCeiling.tables,
        Math.floor(idleAvailable / args.idlePerTable),
      );
      if (mixMaxTables >= 1) {
        const mixCeiling = search("mix", geometricSteps(mixMaxTables, args.startTables), (n) =>
          runAt(n, n * args.idlePerTable, `mix-t${n}-i${n * args.idlePerTable}`),
        );
        if (mixCeiling) {
          summary.results.mixCeiling = {
            tables: mixCeiling.tables,
            idle: mixCeiling.idle,
            usersInSession: mixCeiling.usersInSession,
            pjPerTable: mixCeiling.pjPerTable,
          };
          summary.results.recommendedNormal = recommendedOperating(
            summary.results.mixCeiling,
            args.operatingRatio,
          );
          const rec = summary.results.recommendedNormal;
          console.log(
            `\nMix max : ${mixCeiling.tables} tables + ${mixCeiling.idle} hors session`,
          );
          console.log(
            `Recommandé (70 %) : ${rec.tables} tables + ${rec.idle} hors session`,
          );
        } else {
          console.log("\nMix : aucun palier vert.");
        }
      }
    }

    summary.finishedAt = new Date().toISOString();
    fs.mkdirSync(path.join(root, "reports"), { recursive: true });
    const jsonPath = path.join(root, "reports", `capacity-summary-${runId}.json`);
    const mdPath = path.join(root, "reports", `capacity-summary-${runId}.md`);
    fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
    fs.writeFileSync(mdPath, formatSummaryMarkdown(summary));
    console.log(`\nRésumé : ${mdPath}`);
    console.log(formatSummaryMarkdown(summary));
  } finally {
    teardown();
  }
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
