/** @see FR-admin-kpi-period-persistence */

import type { Period } from "@/lib/businessKpis.types";

export const PERIOD_PRESETS = [
  { label: "7 derniers jours", days: 7, period: "daily" as Period },
  { label: "30 derniers jours", days: 30, period: "daily" as Period },
  { label: "3 derniers mois", days: 90, period: "weekly" as Period },
  { label: "12 derniers mois", days: 365, period: "monthly" as Period },
];

export const KPI_PERIOD_STORAGE_KEY = "chariot.admin.kpiPeriod";

export type KpiPeriodSelection = {
  preset: number;
  period: Period;
};

export const DEFAULT_KPI_PERIOD: KpiPeriodSelection = {
  preset: 1,
  period: "daily",
};

const listeners = new Set<() => void>();
let memory: KpiPeriodSelection | null = null;

function isPeriod(value: unknown): value is Period {
  return value === "daily" || value === "weekly" || value === "monthly";
}

function intern(selection: KpiPeriodSelection): KpiPeriodSelection {
  if (
    selection.preset === DEFAULT_KPI_PERIOD.preset &&
    selection.period === DEFAULT_KPI_PERIOD.period
  ) {
    return DEFAULT_KPI_PERIOD;
  }
  return selection;
}

export function parseKpiPeriodSelection(raw: string | null): KpiPeriodSelection {
  if (raw == null || raw.trim() === "") {
    return DEFAULT_KPI_PERIOD;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_KPI_PERIOD;
    }

    const preset = "preset" in parsed ? parsed.preset : undefined;
    const period = "period" in parsed ? parsed.period : undefined;

    if (
      typeof preset !== "number" ||
      !Number.isInteger(preset) ||
      preset < 0 ||
      preset >= PERIOD_PRESETS.length ||
      !isPeriod(period)
    ) {
      return DEFAULT_KPI_PERIOD;
    }

    return intern({ preset, period });
  } catch {
    return DEFAULT_KPI_PERIOD;
  }
}

export function readKpiPeriodSelectionFromStorage(
  storage: { getItem(key: string): string | null } | null,
): KpiPeriodSelection {
  if (!storage) {
    return DEFAULT_KPI_PERIOD;
  }

  try {
    return parseKpiPeriodSelection(storage.getItem(KPI_PERIOD_STORAGE_KEY));
  } catch {
    return DEFAULT_KPI_PERIOD;
  }
}

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function emit(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

export function subscribeKpiPeriodSelection(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getKpiPeriodServerSnapshot(): KpiPeriodSelection {
  return DEFAULT_KPI_PERIOD;
}

export function getKpiPeriodSnapshot(): KpiPeriodSelection {
  if (!memory) {
    memory = readKpiPeriodSelectionFromStorage(getSessionStorage());
  }
  return memory;
}

export function persistKpiPeriodSelection(selection: KpiPeriodSelection): void {
  const normalized = intern(parseKpiPeriodSelection(JSON.stringify(selection)));
  memory = normalized;
  const storage = getSessionStorage();
  if (storage) {
    try {
      storage.setItem(KPI_PERIOD_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Private mode / quota: in-memory selection still covers in-tab navigation.
    }
  }
  emit();
}
