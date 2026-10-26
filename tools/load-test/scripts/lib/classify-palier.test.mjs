import test from "node:test";
import assert from "node:assert/strict";
import { classifyPalier } from "./classify-palier.mjs";

function report(overrides = {}) {
  return {
    aggregate: {
      counters: {
        "vusers.created": 30,
        "vusers.completed": 30,
        "vusers.failed": 0,
        "capacity.http_total": 100,
        "capacity.http_5xx": 0,
        "capacity.ws_join_ok": 30,
        "capacity.ws_join_fail": 0,
        ...(overrides.counters ?? {}),
      },
      summaries: {
        "capacity.user_me": { p95: 200 },
        ...(overrides.summaries ?? {}),
      },
    },
  };
}

test("FR-load-test-capacity — nominal green palier", () => {
  const result = classifyPalier(report());
  assert.equal(result.verdict, "green");
  assert.equal(result.reasons.length, 0);
  assert.equal(result.metrics.p95UserMeMs, 200);
});

test("FR-load-test-capacity — p95 /api/user/me > 1s is red", () => {
  const result = classifyPalier(
    report({ summaries: { "capacity.user_me": { p95: 1500 } } }),
  );
  assert.equal(result.verdict, "red");
  assert.ok(result.reasons.some((r) => r.includes("/api/user/me")));
});

test("FR-load-test-capacity — write p95 > 1s is red", () => {
  const result = classifyPalier(
    report({
      summaries: {
        "capacity.user_me": { p95: 200 },
        "capacity.campaign_write": { p95: 1800 },
      },
    }),
  );
  assert.equal(result.verdict, "red");
  assert.ok(result.reasons.some((r) => r.includes("campaign write")));
});

test("FR-load-test-capacity — missing report is red", () => {
  const result = classifyPalier(null);
  assert.equal(result.verdict, "red");
});
