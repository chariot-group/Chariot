import { describe, expect, it } from "vitest";
import {
  mergeParticipantsPreserveCharacterIds,
  participantsStableKey,
} from "@/lib/sessionParticipantMerge";
import type { SessionParticipant } from "@/services/SessionService";

function makeParticipant(overrides: Partial<SessionParticipant> = {}): SessionParticipant {
  return {
    id: "p1",
    userId: "user-1",
    characterId: null,
    status: "connected",
    joinedAt: "2026-01-01T00:00:00.000Z",
    sessionId: "CODE01",
    ...overrides,
  };
}

describe("participantsStableKey", () => {
  it("nominal: ignores participant order", () => {
    const a = [makeParticipant({ userId: "b" }), makeParticipant({ userId: "a" })];
    const b = [makeParticipant({ userId: "a" }), makeParticipant({ userId: "b" })];

    expect(participantsStableKey(a)).toBe(participantsStableKey(b));
  });

  it("edge: merge preserves characterId without changing stable key when HTTP payload is empty", () => {
    const previous = [makeParticipant({ userId: "u1", characterId: "char-1" })];
    const fetched = [makeParticipant({ userId: "u1", characterId: null })];
    const merged = mergeParticipantsPreserveCharacterIds(previous, fetched);

    expect(participantsStableKey(previous)).toBe(participantsStableKey(merged));
  });
});
