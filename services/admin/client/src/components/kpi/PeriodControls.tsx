"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERIOD_PRESETS } from "@/lib/businessPeriod";
import type { Period } from "@/lib/businessKpis.types";

export function PeriodControls({
  preset,
  period,
  loading,
  onPreset,
  onPeriod,
  onRefresh,
}: {
  preset: number;
  period: Period;
  loading: boolean;
  onPreset: (index: number) => void;
  onPeriod: (period: Period) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Période">
        {PERIOD_PRESETS.map((item, index) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onPreset(index)}
            aria-pressed={preset === index}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              preset === index
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-card-foreground"
            }`}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 sm:ml-auto">
        <Select
          value={period}
          onValueChange={(value) => onPeriod(value as Period)}>
          <SelectTrigger
            className="w-36 h-8 text-xs"
            aria-label="Granularité du graphique">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Journalier</SelectItem>
            <SelectItem value="weekly">Hebdomadaire</SelectItem>
            <SelectItem value="monthly">Mensuel</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Actualiser les KPI">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
