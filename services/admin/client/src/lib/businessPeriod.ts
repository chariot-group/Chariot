import type { Period } from "@/lib/businessKpis.types";

export const PERIOD_PRESETS = [
  { label: "7 derniers jours", days: 7, period: "daily" as Period },
  { label: "30 derniers jours", days: 30, period: "daily" as Period },
  { label: "3 derniers mois", days: 90, period: "weekly" as Period },
  { label: "12 derniers mois", days: 365, period: "monthly" as Period },
];
