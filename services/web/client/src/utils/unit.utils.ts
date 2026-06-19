// Conversion rates defined by FR-037: 5 ft = 1.5 m
const FT_TO_M = 0.3;
const M_TO_FT = 1 / FT_TO_M;
const FT_TO_CM = 30.48;
const CM_TO_FT = 1 / FT_TO_CM;
const LBS_TO_KG = 0.4536;
const KG_TO_LBS = 1 / LBS_TO_KG;

export type MeasurementUnit = "metric" | "imperial";

// ─── Distance (feet / meters) ─────────────────────────────────────────────────

export function feetToMeters(ft: number): number {
  return Math.round(ft * FT_TO_M * 10) / 10;
}

export function metersToFeet(m: number): number {
  return Math.round(m * M_TO_FT);
}

export function displayDistanceFt(ft: number, unit: MeasurementUnit): number {
  return unit === "metric" ? feetToMeters(ft) : ft;
}

export function isMetric(unit: MeasurementUnit): boolean {
  return unit === "metric";
}

/**
 * Converts a free-text range string (e.g. "30 ft.", "60/120 ft.", "Self (10-foot cone)")
 * to the user's preferred unit. Non-numeric strings pass through unchanged.
 */
export function convertRangeString(range: string, unit: MeasurementUnit): string {
  if (unit === "imperial") return range;

  return range
    .replace(/(\d+(?:\.\d+)?)-foot/gi, (_, num) => `${feetToMeters(parseFloat(num))}-meter`)
    .replace(/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\s*(?:ft\.?|feet)/gi, (_, n1, n2) => {
      return `${feetToMeters(parseFloat(n1))}/${feetToMeters(parseFloat(n2))} m`;
    })
    .replace(/(\d+(?:\.\d+)?)\s*(?:ft\.?|feet|foot)/gi, (_, num) => `${feetToMeters(parseFloat(num))} m`)
    .replace(/-meter/gi, " m");
}

/**
 * Like convertRangeString but appends the original ft value in parentheses for "show both" mode.
 * E.g. "30 ft." → "9 m (30 ft.)"
 */
export function convertRangeStringBoth(range: string): string {
  const converted = convertRangeString(range, "metric");
  if (converted === range) return range;
  return `${converted} (${range})`;
}

// ─── Height (feet / cm) ───────────────────────────────────────────────────────

export function feetToCm(ft: number): number {
  return Math.round(ft * FT_TO_CM);
}

export function cmToFeet(cm: number): number {
  return Math.round(cm * CM_TO_FT * 10) / 10;
}

export function displayHeightFt(ft: number, unit: MeasurementUnit): number {
  return unit === "metric" ? feetToCm(ft) : ft;
}

export const HEIGHT_UNIT_LABEL: Record<MeasurementUnit, string> = {
  metric: "cm",
  imperial: "ft",
};

// ─── Weight (lbs / kg) ────────────────────────────────────────────────────────

export function lbsToKg(lbs: number): number {
  return Math.round(lbs * LBS_TO_KG * 10) / 10;
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS);
}

export function displayWeightLbs(lbs: number, unit: MeasurementUnit): number {
  return unit === "metric" ? lbsToKg(lbs) : lbs;
}

export const WEIGHT_UNIT_LABEL: Record<MeasurementUnit, string> = {
  metric: "kg",
  imperial: "lbs",
};
