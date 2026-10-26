import test from "node:test";
import assert from "node:assert/strict";
import { formatSummaryMarkdown } from "./summary.mjs";

test("FR-load-test-capacity — summary lists the three answers", () => {
  const md = formatSummaryMarkdown({
    runId: "demo",
    profile: "mixed-realistic",
    createdAt: "t0",
    finishedAt: "t1",
    paliers: [],
    results: {
      tableCeiling: {
        tables: 40,
        usersInSession: 180,
        idle: 0,
        pjPerTable: { min: 3, median: 5, max: 8, mean: 5.2 },
      },
      idleWithTablesCeiling: { tables: 20, idle: 80, usersInSession: 90 },
      mixCeiling: { tables: 30, idle: 60, usersInSession: 140 },
      recommendedNormal: { tables: 21, idle: 42, usersInSession: 98 },
    },
  });
  assert.match(md, /Plafond tables.*40 tables/);
  assert.match(md, /Plafond hors session.*80 users hors session/);
  assert.match(md, /Fonctionnement recommandé.*21 tables.*42 users hors session/);
});
