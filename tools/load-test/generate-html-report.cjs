"use strict";

const fs = require("fs");
const path = require("path");

const inputPath = process.argv[2];
const outputPath =
  process.argv[3] ||
  (inputPath ? inputPath.replace(/\.json$/i, ".html") : "report.html");

if (!inputPath) {
  console.error("Usage: node generate-html-report.cjs <report.json> [output.html]");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(path.resolve(inputPath), "utf8"));
const aggregate = raw.aggregate ?? raw;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCounterKey(key) {
  return key.replace(/^plugins\.metrics-by-endpoint\./, "");
}

function isErrorCounter(key, value) {
  if (typeof value !== "number" || value <= 0) return false;
  return (
    key.startsWith("errors.") ||
    key.includes(".failed") ||
    key.includes(".codes.4") ||
    key.includes(".codes.5")
  );
}

function rowsFromRecord(record, { errorHighlight = false } = {}) {
  if (!record || typeof record !== "object") return "";
  return Object.entries(record)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const cls = errorHighlight && isErrorCounter(key, value) ? ' class="err"' : "";
      return `<tr${cls}><td>${escapeHtml(formatCounterKey(key))}</td><td>${escapeHtml(value)}</td></tr>`;
    })
    .join("\n");
}

function summaryRows(summaries) {
  if (!summaries) return "";
  return Object.entries(summaries)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, stats]) => {
      const cells = ["min", "max", "mean", "median", "p95", "p99"]
        .filter((k) => stats[k] !== undefined)
        .map((k) => `<td>${escapeHtml(stats[k])}</td>`)
        .join("");
      return `<tr><td>${escapeHtml(name)}</td>${cells}</tr>`;
    })
    .join("\n");
}

const title = path.basename(inputPath, ".json");
const generatedAt = new Date().toISOString();
const counters = aggregate.counters ?? {};
const summaries = aggregate.summaries ?? {};
const rates = aggregate.rates ?? {};

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Artillery — ${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
    body { margin: 1.5rem; line-height: 1.45; max-width: 1100px; }
    h1 { font-size: 1.35rem; margin-bottom: 0.25rem; }
    .meta { color: #666; margin-bottom: 1.5rem; font-size: 0.9rem; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 1.5rem; font-size: 0.9rem; }
    th, td { border: 1px solid #ccc; padding: 0.35rem 0.5rem; text-align: left; vertical-align: top; }
    th { background: #f4f4f4; }
    tr.err td { background: #fde8e8; }
    @media (prefers-color-scheme: dark) {
      th { background: #2a2a2a; }
      tr.err td { background: #4a2020; }
    }
  </style>
</head>
<body>
  <h1>Rapport Artillery — ${escapeHtml(title)}</h1>
  <p class="meta">Généré le ${escapeHtml(generatedAt)} · source ${escapeHtml(path.basename(inputPath))}</p>

  <h2>Compteurs</h2>
  <table>
    <thead><tr><th>Métrique</th><th>Valeur</th></tr></thead>
    <tbody>${rowsFromRecord(counters, { errorHighlight: true })}</tbody>
  </table>

  <h2>Débits</h2>
  <table>
    <thead><tr><th>Métrique</th><th>Valeur</th></tr></thead>
    <tbody>${rowsFromRecord(rates) || "<tr><td colspan=\"2\">—</td></tr>"}</tbody>
  </table>

  <h2>Latences (agrégat)</h2>
  <table>
    <thead><tr><th>Métrique</th><th>min</th><th>max</th><th>mean</th><th>median</th><th>p95</th><th>p99</th></tr></thead>
    <tbody>${summaryRows(summaries) || "<tr><td colspan=\"7\">—</td></tr>"}</tbody>
  </table>
</body>
</html>
`;

fs.writeFileSync(path.resolve(outputPath), html, "utf8");
console.log(`HTML report: ${outputPath}`);
