import type { Character } from "@/types/character";
import type { InitiativeTrackerRow } from "@/store/slices/sessionSlice";

export function trackerHpFromCharacter(
  character: Character,
): Pick<InitiativeTrackerRow, "hitPoints" | "maxHitPoints" | "tempHitPoints"> {
  const stats = character.stats;
  return {
    hitPoints: Number.isFinite(stats?.currentHitPoints)
      ? Number(stats.currentHitPoints)
      : Number(stats?.maxHitPoints ?? 0),
    maxHitPoints: Number.isFinite(stats?.maxHitPoints) ? Number(stats.maxHitPoints) : 0,
    tempHitPoints: Number.isFinite(stats?.tempHitPoints) ? Number(stats.tempHitPoints) : 0,
  };
}

export function characterName(firstname: string, lastname: string, surname: string): string {
  const fullName = `${firstname ?? ""} ${lastname ?? ""}`.trim();
  return fullName || surname || "-";
}

export function clampConditionIndex(index: number, length: number) {
  if (length === 0) return -1;
  return Math.max(0, Math.min(index, length - 1));
}

export function sortInitiativeTrackerRows(rows: InitiativeTrackerRow[]): InitiativeTrackerRow[] {
  return [...rows].sort((a, b) => b.initiative - a.initiative || a.groupLabel.localeCompare(b.groupLabel));
}

export function buildBattleTurnKey(round: number, rowId: string) {
  return `${round}:${rowId}`;
}

export function getPreviousBattleTurn(
  sortedRows: InitiativeTrackerRow[],
  currentRound: number,
  activeTurnRowId: string | null,
): { round: number; rowId: string } | null {
  if (!activeTurnRowId || sortedRows.length === 0) return null;

  const currentIndex = sortedRows.findIndex((row) => row.id === activeTurnRowId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  if (safeIndex <= 0) {
    if (currentRound <= 1) return null;
    const rowId = sortedRows[sortedRows.length - 1]?.id;
    if (!rowId) return null;
    return { round: currentRound - 1, rowId };
  }

  const rowId = sortedRows[safeIndex - 1]?.id;
  if (!rowId) return null;
  return { round: currentRound, rowId };
}

export function isBattleTurnLocked(turnKey: string, turnsWithActions: string[]) {
  return turnsWithActions.includes(turnKey);
}

export function canUndoBattleTurn(
  sortedRows: InitiativeTrackerRow[],
  currentRound: number,
  activeTurnRowId: string | null,
  turnsWithActions: string[],
): boolean {
  const previousTurn = getPreviousBattleTurn(sortedRows, currentRound, activeTurnRowId);
  if (!previousTurn || !activeTurnRowId) return false;

  const currentKey = buildBattleTurnKey(currentRound, activeTurnRowId);

  if (isBattleTurnLocked(currentKey, turnsWithActions)) return false;

  return true;
}
