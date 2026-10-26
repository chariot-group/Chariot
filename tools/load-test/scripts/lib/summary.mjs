/** @see FR-load-test-capacity */

function pjLine(stats) {
  if (!stats) return "n/a";
  return `min ${stats.min} / médiane ${stats.median} / max ${stats.max} / moyenne ${stats.mean}`;
}

function palierLine(p) {
  const p95 = p.metrics?.p95UserMeMs != null ? `${Math.round(p.metrics.p95UserMeMs)} ms` : "n/a";
  const write = [
    p.metrics?.p95CampaignWriteMs != null ? `campagne ${Math.round(p.metrics.p95CampaignWriteMs)} ms` : null,
    p.metrics?.p95PlayerWriteMs != null ? `PJ ${Math.round(p.metrics.p95PlayerWriteMs)} ms` : null,
  ]
    .filter(Boolean)
    .join(", ");
  return `| ${p.name} | ${p.tables} | ${p.usersInSession} | ${p.idle} | ${p95} | ${write || "—"} | ${p.verdict} |`;
}

export function formatSummaryMarkdown(summary) {
  const table = summary.results?.tableCeiling;
  const idle = summary.results?.idleWithTablesCeiling;
  const mix = summary.results?.mixCeiling;
  const rec = summary.results?.recommendedNormal;
  const paliers = summary.paliers ?? [];

  const answers = [
    "## Réponses",
    "",
    table
      ? `- **Plafond tables** : **${table.tables} tables**, ${table.usersInSession} users en session, 0 hors session. PJ/table : ${pjLine(table.pjPerTable)}.`
      : "- **Plafond tables** : aucun palier vert (plafond sous le premier palier testé).",
    idle
      ? `- **Plafond hors session avec tables** : **${idle.idle} users hors session** pendant **${idle.tables} tables** (${idle.usersInSession} users en session).`
      : "- **Plafond hors session avec tables** : aucun palier vert.",
    mix
      ? `- **Mix max (vert)** : **${mix.tables} tables** + **${mix.idle} users hors session** (${mix.usersInSession} users en session).`
      : "- **Mix max (vert)** : aucun palier vert.",
    rec
      ? `- **Fonctionnement recommandé (70 %)** : **${rec.tables} tables** + **${rec.idle} users hors session** (~${rec.usersInSession} users en session).`
      : "- **Fonctionnement recommandé** : indisponible (pas de mix vert).",
  ];

  return [
    `# Capacité ${summary.runId}`,
    "",
    `Profil \`${summary.profile}\` — ${summary.createdAt} → ${summary.finishedAt ?? "?"}`,
    "",
    ...answers,
    "",
    "## Paliers",
    "",
    "| Palier | Tables | En session | Hors session | p95 /me | p95 writes | Verdict |",
    "| --- | ---: | ---: | ---: | --- | --- | --- |",
    ...paliers.map(palierLine),
    "",
  ].join("\n");
}
