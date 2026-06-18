// Conversion rate defined by FR-032: 5 ft = 1.5 m
const FT_TO_M = 0.3;
const M_TO_FT = 1 / FT_TO_M;

export type MeasurementUnit = "metric" | "imperial";

export function feetToMeters(ft: number): number {
  return Math.round(ft * FT_TO_M * 10) / 10;
}

export function metersToFeet(m: number): number {
  return Math.round(m * M_TO_FT);
}

/**
 * Returns the display value for a distance stored in feet.
 * Returns the raw feet value for imperial, or the converted meter value for metric.
 */
export function displayDistanceFt(ft: number, unit: MeasurementUnit): number {
  return unit === "metric" ? feetToMeters(ft) : ft;
}

/**
 * Returns the unit abbreviation to display alongside a distance value.
 * For metric always "m"; for imperial the caller should use the i18n "feetAbbr" key.
 */
export function isMetric(unit: MeasurementUnit): boolean {
  return unit === "metric";
}

/**
 * Converts a free-text range string (e.g. "30 ft.", "60/120 ft.", "Self (10-foot cone)")
 * to the user's preferred unit.  Non-numeric strings pass through unchanged.
 */
export function convertRangeString(range: string, unit: MeasurementUnit): string {
  if (unit === "imperial") return range;

  // Replace numbers followed by ft/feet/foot, including hyphenated forms like "10-foot"
  // Also handle dual ranges like "60/120 ft." by replacing each number separately
  return range
    .replace(/(\d+(?:\.\d+)?)-foot/gi, (_, num) => `${feetToMeters(parseFloat(num))}-meter`)
    .replace(/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\s*(?:ft\.?|feet)/gi, (_, n1, n2) => {
      return `${feetToMeters(parseFloat(n1))}/${feetToMeters(parseFloat(n2))} m`;
    })
    .replace(/(\d+(?:\.\d+)?)\s*(?:ft\.?|feet|foot)/gi, (_, num) => `${feetToMeters(parseFloat(num))} m`)
    .replace(/-meter/gi, " m");
}
