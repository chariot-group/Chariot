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

type ConcentrationUpdateApplier = (payload: TrackerConcentrationUpdatePayload) => void;

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

  if (concentrationUpdateApplier) {
    concentrationUpdateApplier(payload);
    return;
  }

  const socket = getPooledSessionSocket();
  if (!socket?.connected) return;

  socket.emit("session:player-concentration-updated", {
    sessionId: sessionCode,
    characterId: payload.characterId,
    concentration: payload.concentration,
    pendingConcentrationCheck: payload.pendingConcentrationCheck ?? null,
  });
}
