import type {
  PendingConcentrationCheck,
  TrackerConcentration,
} from "@/store/slices/sessionSlice";
import { getPooledSessionSocket } from "@/lib/sessionSocketPool";

export type TrackerConcentrationUpdatePayload = {
  characterId: string;
  concentration: TrackerConcentration | null;
  pendingConcentrationCheck?: PendingConcentrationCheck | null;
};

/** Returns true when the update was applied locally (GM path); false to relay via WebSocket. */
type ConcentrationUpdateApplier = (payload: TrackerConcentrationUpdatePayload) => boolean;

let concentrationUpdateApplier: ConcentrationUpdateApplier | null = null;

export function registerConcentrationUpdateApplier(
  applier: ConcentrationUpdateApplier | null,
): void {
  concentrationUpdateApplier = applier;
}

export function submitTrackerConcentrationUpdate(
  sessionCode: string,
  payload: TrackerConcentrationUpdatePayload,
): void {
  if (!payload.characterId?.trim()) return;

  const handledLocally = concentrationUpdateApplier?.(payload) ?? false;
  if (handledLocally) return;

  const socket = getPooledSessionSocket();
  if (!socket?.connected) return;

  socket.emit("session:player-concentration-updated", {
    sessionId: sessionCode,
    characterId: payload.characterId,
    concentration: payload.concentration,
    pendingConcentrationCheck: payload.pendingConcentrationCheck ?? null,
  });
}
