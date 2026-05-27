import type { InitiativeTrackerRow } from "@/store/slices/sessionSlice";
import type { ActiveInitiativeTrackerCondition } from "./types";

export function characterName(firstname: string, lastname: string, surname: string): string {
  const fullName = `${firstname ?? ""} ${lastname ?? ""}`.trim();
  return fullName || surname || "-";
}

export function clampConditionIndex(index: number, conditions: ActiveInitiativeTrackerCondition[]) {
  if (conditions.length === 0) return -1;
  return Math.max(0, Math.min(index, conditions.length - 1));
}

export function sortInitiativeTrackerRows(rows: InitiativeTrackerRow[]): InitiativeTrackerRow[] {
  return [...rows].sort((a, b) => b.initiative - a.initiative || a.groupLabel.localeCompare(b.groupLabel));
}
