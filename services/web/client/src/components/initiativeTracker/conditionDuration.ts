import type {
  InitiativeTrackerConditionDuration,
  InitiativeTrackerConditionEntry,
} from "@/store/slices/sessionSlice";

/** Durée d'un tour de combat en secondes (D&D 5e : un tour = chaque participant a joué). */
export const ROUND_DURATION_SECONDS = 6;

export function durationToRemainingSeconds(
  duration: InitiativeTrackerConditionDuration,
  roundDurationSeconds = ROUND_DURATION_SECONDS,
): number {
  let seconds: number;

  switch (duration.unit) {
    case "seconds":
      seconds = duration.amount;
      break;
    case "minutes":
      seconds = duration.amount * 60;
      break;
    case "hours":
      seconds = duration.amount * 3600;
      break;
    case "rounds":
      seconds = duration.amount * roundDurationSeconds;
      break;
    default:
      return roundDurationSeconds;
  }

  return Math.max(roundDurationSeconds, seconds);
}

export function buildConditionEntry(
  condition: InitiativeTrackerConditionEntry["condition"],
  duration?: InitiativeTrackerConditionDuration,
): InitiativeTrackerConditionEntry {
  if (!duration) {
    return { condition };
  }

  if (duration.unit === "untilCombatEnd") {
    return { condition, duration: { amount: 1, unit: "untilCombatEnd" } };
  }

  return {
    condition,
    duration,
    remainingSeconds: durationToRemainingSeconds(duration),
  };
}

export function ensureConditionEntryRemainingSeconds(
  entry: InitiativeTrackerConditionEntry,
): InitiativeTrackerConditionEntry {
  if (entry.duration?.unit === "untilCombatEnd" || entry.remainingSeconds != null) {
    return entry;
  }

  if (!entry.duration) {
    return entry;
  }

  return {
    ...entry,
    remainingSeconds: durationToRemainingSeconds(entry.duration),
  };
}

export function tickConditionEntries(
  conditions: InitiativeTrackerConditionEntry[],
  deltaSeconds: number,
): InitiativeTrackerConditionEntry[] {
  return conditions
    .map((entry) => {
      if (entry.remainingSeconds == null) {
        return entry;
      }

      return { ...entry, remainingSeconds: entry.remainingSeconds + deltaSeconds };
    })
    .filter((entry) => entry.remainingSeconds == null || entry.remainingSeconds > 0);
}

export function removeUntilCombatEndConditions(
  conditions: InitiativeTrackerConditionEntry[],
): InitiativeTrackerConditionEntry[] {
  return conditions.filter((entry) => entry.duration?.unit !== "untilCombatEnd");
}

export type RemainingConditionDurationFormatter = (
  unit: Exclude<InitiativeTrackerConditionDuration["unit"], "untilCombatEnd">,
  amount: number,
) => string;

export function formatRemainingConditionDuration(
  remainingSeconds: number,
  format: RemainingConditionDurationFormatter,
  roundDurationSeconds = ROUND_DURATION_SECONDS,
): string {
  const normalizedSeconds = Math.max(roundDurationSeconds, Math.round(remainingSeconds));
  const roundCount = normalizedSeconds / roundDurationSeconds;
  const hourThresholdSeconds = 60 * 60;
  const minuteThresholdSeconds = 60;
  const maxRoundDisplayCount = 20;

  if (normalizedSeconds > hourThresholdSeconds) {
    return format("hours", Math.max(1, Math.round(normalizedSeconds / hourThresholdSeconds)));
  }

  if (normalizedSeconds > minuteThresholdSeconds || roundCount > maxRoundDisplayCount) {
    return format("minutes", Math.max(1, Math.round(normalizedSeconds / minuteThresholdSeconds)));
  }

  if (normalizedSeconds >= roundDurationSeconds) {
    return format("rounds", Math.max(1, Math.round(normalizedSeconds / roundDurationSeconds)));
  }

  return format("seconds", normalizedSeconds);
}
