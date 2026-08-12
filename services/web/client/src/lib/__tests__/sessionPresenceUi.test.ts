import { describe, expect, it } from "vitest";
import {
  computeSessionRemainingSeconds,
  formatSessionRemainingDuration,
  isSessionTimerLow,
  resolveHeaderLogoClickIntent,
  shouldShowSessionTimer,
} from "@/lib/sessionPresenceUi";

/** @see FR-session-lobby-navigation */
describe("FR-session-lobby-navigation — header logo intent", () => {
  it("nominal: in session opens the lobby", () => {
    expect(resolveHeaderLogoClickIntent(true)).toBe("openSessionLobby");
  });

  it("regression: outside session goes home", () => {
    expect(resolveHeaderLogoClickIntent(false)).toBe("goHome");
  });
});

/** @see FR-session-lobby-navigation */
describe("FR-session-lobby-navigation — session timer visibility", () => {
  it("nominal: shows the timer when launched with an expiry", () => {
    expect(shouldShowSessionTimer("launched", "2026-08-12T22:00:00.000Z")).toBe(true);
  });

  it("edge: hides the timer before launch", () => {
    expect(shouldShowSessionTimer("activated", "2026-08-12T22:00:00.000Z")).toBe(false);
  });

  it("failure: hides the timer when launched without expiry", () => {
    expect(shouldShowSessionTimer("launched", null)).toBe(false);
    expect(shouldShowSessionTimer("launched", "")).toBe(false);
    expect(shouldShowSessionTimer("launched", undefined)).toBe(false);
  });
});

describe("FR-session-lobby-navigation — remaining duration", () => {
  it("nominal: formats hours, minutes and seconds", () => {
    expect(formatSessionRemainingDuration(3661)).toBe("01:01:01");
  });

  it("edge: clamps non-positive values to zero", () => {
    expect(formatSessionRemainingDuration(0)).toBe("00:00:00");
    expect(formatSessionRemainingDuration(-12)).toBe("00:00:00");
  });

  it("nominal: remaining seconds follow expiresAt", () => {
    const expiresAt = "2026-08-12T22:00:10.000Z";
    const nowMs = Date.parse("2026-08-12T22:00:00.000Z");
    expect(computeSessionRemainingSeconds(expiresAt, nowMs)).toBe(10);
  });

  it("edge: remaining time at 5 minutes is low; one second above is not", () => {
    expect(isSessionTimerLow(300)).toBe(true);
    expect(isSessionTimerLow(301)).toBe(false);
  });
});
