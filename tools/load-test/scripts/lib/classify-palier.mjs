/** @see FR-load-test-capacity */

export const DEFAULT_THRESHOLDS = {
  p95Ms: 1000,
  http5xxRate: 0.01,
  wsFailRate: 0.01,
  vuFailRate: 0.01,
};

export function extractMetrics(report) {
  const aggregate = report?.aggregate ?? report ?? {};
  const counters = aggregate.counters ?? {};
  const summaries = aggregate.summaries ?? {};
  const created = Number(counters["vusers.created"] ?? 0);
  const failed = Number(counters["vusers.failed"] ?? 0);
  const completed = Number(counters["vusers.completed"] ?? 0);
  const httpTotal = Number(counters["capacity.http_total"] ?? 0);
  const http5xx = Number(counters["capacity.http_5xx"] ?? 0);
  const wsOk = Number(counters["capacity.ws_join_ok"] ?? 0);
  const wsFail = Number(counters["capacity.ws_join_fail"] ?? 0);
  return {
    created,
    failed,
    completed,
    httpTotal,
    http5xx,
    http5xxRate: httpTotal > 0 ? http5xx / httpTotal : 0,
    wsOk,
    wsFail,
    wsFailRate: wsOk + wsFail > 0 ? wsFail / (wsOk + wsFail) : 0,
    vuFailRate: created > 0 ? failed / created : failed > 0 ? 1 : 0,
    p95UserMeMs: summaries["capacity.user_me"]?.p95,
    p95CampaignWriteMs: summaries["capacity.campaign_write"]?.p95,
    p95PlayerWriteMs: summaries["capacity.player_write"]?.p95,
  };
}

function overP95(valueMs, thresholdMs, label, reasons) {
  if (valueMs == null) return;
  if (valueMs > thresholdMs) {
    reasons.push(`${label} ${Math.round(valueMs)}ms > ${thresholdMs}ms`);
  }
}

export function classifyPalier(report, thresholds = DEFAULT_THRESHOLDS) {
  if (!report) {
    return {
      verdict: "red",
      reasons: ["rapport Artillery absent"],
      metrics: extractMetrics({}),
    };
  }

  const metrics = extractMetrics(report);
  const reasons = [];

  if (metrics.p95UserMeMs == null) {
    reasons.push("p95 GET /api/user/me manquant");
  } else {
    overP95(metrics.p95UserMeMs, thresholds.p95Ms, "p95 /api/user/me", reasons);
  }
  overP95(metrics.p95CampaignWriteMs, thresholds.p95Ms, "p95 campaign write", reasons);
  overP95(metrics.p95PlayerWriteMs, thresholds.p95Ms, "p95 player write", reasons);

  if (metrics.http5xxRate > thresholds.http5xxRate) {
    reasons.push(`5xx ${(metrics.http5xxRate * 100).toFixed(2)}% > ${thresholds.http5xxRate * 100}%`);
  }
  if (metrics.wsFailRate > thresholds.wsFailRate) {
    reasons.push(`WS fail ${(metrics.wsFailRate * 100).toFixed(2)}% > ${thresholds.wsFailRate * 100}%`);
  }
  if (metrics.vuFailRate > thresholds.vuFailRate) {
    reasons.push(`VU fail ${(metrics.vuFailRate * 100).toFixed(2)}% > ${thresholds.vuFailRate * 100}%`);
  }

  return {
    verdict: reasons.length > 0 ? "red" : "green",
    reasons,
    metrics,
  };
}
