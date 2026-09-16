"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getKpiPeriodServerSnapshot,
  getKpiPeriodSnapshot,
  persistKpiPeriodSelection,
  PERIOD_PRESETS,
  subscribeKpiPeriodSelection,
} from "@/lib/businessPeriod";
import type { Period } from "@/lib/businessKpis.types";

const subscribeIsClient = () => () => undefined;
const getIsClientSnapshot = () => true;
const getIsClientServerSnapshot = () => false;

/** @see FR-admin-kpi-period-persistence */
export function useKpiPeriodSelection() {
  const selection = useSyncExternalStore(
    subscribeKpiPeriodSelection,
    getKpiPeriodSnapshot,
    getKpiPeriodServerSnapshot,
  );
  const isClient = useSyncExternalStore(subscribeIsClient, getIsClientSnapshot, getIsClientServerSnapshot);

  const setPreset = useCallback((index: number) => {
    if (index < 0 || index >= PERIOD_PRESETS.length) {
      return;
    }

    persistKpiPeriodSelection({ preset: index, period: PERIOD_PRESETS[index].period });
  }, []);

  const setPeriod = useCallback((next: Period) => {
    persistKpiPeriodSelection({ preset: getKpiPeriodSnapshot().preset, period: next });
  }, []);

  return {
    preset: selection.preset,
    period: selection.period,
    ready: isClient,
    setPreset,
    setPeriod,
  };
}
