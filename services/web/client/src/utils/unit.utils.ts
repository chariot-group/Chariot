// Conversion rates defined by FR-038: 5 ft = 1.5 m
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
  return Math.round(m * M_TO_FT * 10) / 10;
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
  return Math.round(cm * CM_TO_FT * 100) / 100;
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
  return Math.round(kg * KG_TO_LBS * 10) / 10;
}

export function displayWeightLbs(lbs: number, unit: MeasurementUnit): number {
  return unit === "metric" ? lbsToKg(lbs) : lbs;
}

export const WEIGHT_UNIT_LABEL: Record<MeasurementUnit, string> = {
  metric: "kg",
  imperial: "lbs",
};

const FEET_RANGE_PATTERN = /^(\d+(?:\.\d+)?)\s*ft\.?$/i;
const FEET_DUAL_RANGE_PATTERN = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*ft\.?$/i;

/** Parses a canonical stored range such as "30 ft." into its feet value. */
export function parseStoredFeetRange(stored: string): number | null {
  const match = stored.match(FEET_RANGE_PATTERN);
  if (!match) return null;
  return parseFloat(match[1]);
}

/** Parses a canonical dual range such as "80/320 ft." into [normalFeet, longFeet], or null. */
export function parseStoredFeetDualRange(stored: string): [number, number] | null {
  const match = stored.match(FEET_DUAL_RANGE_PATTERN);
  if (!match) return null;
  return [parseFloat(match[1]), parseFloat(match[2])];
}

/** Formats two feet values into the canonical dual range string "X/Y ft.". */
export function formatStoredFeetDualRange(normalFt: number, longFt: number): string {
  return `${normalFt}/${longFt} ft.`;
}

/** Returns true if the stored value is a dual range "X/Y ft." format. */
export function isStoredFeetDualRange(stored: string): boolean {
  return FEET_DUAL_RANGE_PATTERN.test(stored.trim());
}

/** Formats a feet value into the canonical stored range string. */
export function formatStoredFeetRange(feet: number): string {
  return `${feet} ft.`;
}

/** Maps a stored feet range string to display-unit text; free-text ranges pass through. */
export function storedFeetRangeToDisplayText(
  stored: string,
  toDisplay: (feet: number) => number,
): string {
  if (stored.trim() === "") return "";

  const feet = parseStoredFeetRange(stored);
  if (feet == null) return stored;

  return String(toDisplay(feet));
}

/** Commits display text to a stored range string, feet range, empty, or free text. */
export function displayTextToStoredFeetRange(
  displayText: string,
  toStored: (displayValue: number) => number,
): string | null | "invalid" {
  const trimmed = displayText.trim();
  if (trimmed === "") return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return trimmed;

  return formatStoredFeetRange(toStored(parsed));
}
