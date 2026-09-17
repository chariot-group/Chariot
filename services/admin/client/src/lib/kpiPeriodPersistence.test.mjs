import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Mirrors src/lib/businessPeriod.ts for node:test without a TS runner.
const PERIOD_PRESETS_LENGTH = 4;
const KPI_PERIOD_STORAGE_KEY = "chariot.admin.kpiPeriod";
const DEFAULT_KPI_PERIOD = { preset: 1, period: "daily" };

function isPeriod(value) {
  return value === "daily" || value === "weekly" || value === "monthly";
}

function parseKpiPeriodSelection(raw) {
  if (raw == null || raw.trim() === "") {
    return { ...DEFAULT_KPI_PERIOD };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { ...DEFAULT_KPI_PERIOD };
    }

    const { preset, period } = parsed;
    if (
      typeof preset !== "number" ||
      !Number.isInteger(preset) ||
      preset < 0 ||
      preset >= PERIOD_PRESETS_LENGTH ||
      !isPeriod(period)
    ) {
      return { ...DEFAULT_KPI_PERIOD };
    }

    return { preset, period };
  } catch {
    return { ...DEFAULT_KPI_PERIOD };
  }
}

function readKpiPeriodSelectionFromStorage(storage) {
  if (!storage) {
    return { ...DEFAULT_KPI_PERIOD };
  }

  try {
    return parseKpiPeriodSelection(storage.getItem(KPI_PERIOD_STORAGE_KEY));
  } catch {
    return { ...DEFAULT_KPI_PERIOD };
  }
}

function persistKpiPeriodSelection(selection, storage, memoryRef) {
  const normalized = parseKpiPeriodSelection(JSON.stringify(selection));
  memoryRef.current = normalized;
  if (!storage) {
    return;
  }

  storage.setItem(KPI_PERIOD_STORAGE_KEY, JSON.stringify(normalized));
}

function hydrateKpiPeriodSelection(storage, memoryRef) {
  if (memoryRef.current) {
    return { ...memoryRef.current };
  }

  memoryRef.current = readKpiPeriodSelectionFromStorage(storage);
  return { ...memoryRef.current };
}

function createMemoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.hasOwn(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = value;
    },
  };
}

describe("FR-admin-kpi-period-persistence parseKpiPeriodSelection", () => {
  it("nominal: keeps a stored 12-month selection", () => {
    assert.deepEqual(parseKpiPeriodSelection(JSON.stringify({ preset: 3, period: "monthly" })), {
      preset: 3,
      period: "monthly",
    });
  });

  it("edge: invalid preset index falls back to 30 days / daily", () => {
    assert.deepEqual(parseKpiPeriodSelection(JSON.stringify({ preset: 99, period: "monthly" })), DEFAULT_KPI_PERIOD);
    assert.deepEqual(parseKpiPeriodSelection(JSON.stringify({ preset: 3, period: "yearly" })), DEFAULT_KPI_PERIOD);
    assert.deepEqual(parseKpiPeriodSelection("{not-json"), DEFAULT_KPI_PERIOD);
  });

  it("failure: missing stored selection uses the default 30 days / daily", () => {
    assert.deepEqual(parseKpiPeriodSelection(null), DEFAULT_KPI_PERIOD);
    assert.deepEqual(parseKpiPeriodSelection(""), DEFAULT_KPI_PERIOD);
    assert.deepEqual(readKpiPeriodSelectionFromStorage(null), DEFAULT_KPI_PERIOD);
    assert.deepEqual(readKpiPeriodSelectionFromStorage(createMemoryStorage()), DEFAULT_KPI_PERIOD);
  });
});

describe("FR-admin-kpi-period-persistence shared selection", () => {
  it("nominal: selecting 12 months then opening another page keeps that preset", () => {
    const storage = createMemoryStorage();
    const firstPageMemory = { current: null };
    persistKpiPeriodSelection({ preset: 3, period: "monthly" }, storage, firstPageMemory);

    const secondPageMemory = { current: null };
    const restored = hydrateKpiPeriodSelection(storage, secondPageMemory);

    assert.deepEqual(restored, { preset: 3, period: "monthly" });
    assert.equal(storage.getItem(KPI_PERIOD_STORAGE_KEY), JSON.stringify({ preset: 3, period: "monthly" }));
  });

  it("nominal: in-tab navigation reuses memory without waiting for storage", () => {
    const memoryRef = { current: null };
    persistKpiPeriodSelection({ preset: 0, period: "daily" }, null, memoryRef);

    assert.deepEqual(hydrateKpiPeriodSelection(null, memoryRef), { preset: 0, period: "daily" });
  });
});
