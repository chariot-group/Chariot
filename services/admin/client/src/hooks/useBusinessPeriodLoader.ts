"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useKpiPeriodSelection } from "@/hooks/useKpiPeriodSelection";
import { PERIOD_PRESETS } from "@/lib/businessPeriod";
import type { Period } from "@/lib/businessKpis.types";

export function useBusinessPeriodLoader<T>(
  loadData: (params: { period: Period; from: string; to: string }) => Promise<T>,
  errorToastId: string,
  errorMessage: string,
) {
  const { preset, period, ready, setPreset, setPeriod } = useKpiPeriodSelection();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { days, period: defaultPeriod } = PERIOD_PRESETS[preset];
      const activePeriod = period ?? defaultPeriod;
      const to = new Date();
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const result = await loadData({
        period: activePeriod,
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      });
      setData(result);
    } catch {
      setError(true);
      toast.error(errorMessage, { toastId: errorToastId });
    } finally {
      setLoading(false);
    }
  }, [preset, period, loadData, errorToastId, errorMessage]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [load, ready]);

  return {
    data,
    loading,
    error,
    preset,
    period,
    setPreset,
    setPeriod,
    load,
  };
}
