import { describe, expect, it } from "vitest";
import {
  resolveReturnToSessionTone,
  resolveSessionActionRole,
  shouldShowLobbyOpenIndicator,
  computeSessionRemainingSeconds,
  formatSessionRemainingDuration,
  isSessionTimerLow,
  resolveHeaderLogoClickIntent,
  resolveSessionLiveTone,
  resolveHeaderSessionIndicatorTone,
  shouldNotifySessionTimeWarning,
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

  it("edge: remaining time at 5 minutes is critical; one second above is warning", () => {
    expect(isSessionTimerLow(300)).toBe(true);
    expect(isSessionTimerLow(301)).toBe(false);
  });

  it("nominal: more than 30 minutes stays live", () => {
    expect(resolveSessionLiveTone(30 * 60 + 1)).toBe("live");
  });

  it("edge: 30 minutes remaining is warning; 5 minutes is critical", () => {
    expect(resolveSessionLiveTone(30 * 60)).toBe("warning");
    expect(resolveSessionLiveTone(5 * 60 + 1)).toBe("warning");
    expect(resolveSessionLiveTone(5 * 60)).toBe("critical");
  });

  it("failure: missing remaining time stays live", () => {
    expect(resolveSessionLiveTone(null)).toBe("live");
  });
});

describe("FR-session-lobby-navigation — 30-minute warning toast", () => {
  it("nominal: crossing 30 minutes notifies once", () => {
    expect(
      shouldNotifySessionTimeWarning({
        previousRemainingSeconds: 30 * 60 + 1,
        currentRemainingSeconds: 30 * 60,
      }),
    ).toBe(true);
  });

  it("edge: already below 30 minutes on mount does not notify", () => {
    expect(
      shouldNotifySessionTimeWarning({
        previousRemainingSeconds: null,
        currentRemainingSeconds: 25 * 60,
      }),
    ).toBe(false);
  });

  it("edge: jumping over the threshold while backgrounded still notifies", () => {
    expect(
      shouldNotifySessionTimeWarning({
        previousRemainingSeconds: 40 * 60,
        currentRemainingSeconds: 20 * 60,
      }),
    ).toBe(true);
  });

  it("failure: missing remaining time does not notify", () => {
    expect(
      shouldNotifySessionTimeWarning({
        previousRemainingSeconds: 40 * 60,
        currentRemainingSeconds: null,
      }),
    ).toBe(false);
  });
});

describe("FR-session-lobby-navigation — header indicator before launch", () => {
  it("nominal: launched session uses the live tone", () => {
    expect(resolveHeaderSessionIndicatorTone(true, 2 * 60 * 60)).toBe("live");
  });

  it("edge: lobby (not launched) shows preparing, even without remaining time", () => {
    expect(resolveHeaderSessionIndicatorTone(false, null)).toBe("preparing");
  });

  it("guard: stale low remaining time does not show critical before launch", () => {
    expect(resolveHeaderSessionIndicatorTone(false, 60)).toBe("preparing");
    expect(resolveHeaderSessionIndicatorTone(true, 60)).toBe("critical");
  });
});

describe("resolveSessionActionRole", () => {
  it("nominal: roster status wins over context mode", () => {
    expect(resolveSessionActionRole("gameMaster", "player")).toBe("gm");
    expect(resolveSessionActionRole("connected", "gm")).toBe("player");
  });

  it("edge: roster not loaded yet falls back to context mode", () => {
    expect(resolveSessionActionRole(null, "gm")).toBe("gm");
    expect(resolveSessionActionRole(undefined, "player")).toBe("player");
  });

  it("guard: unknown context mode defaults to player", () => {
    expect(resolveSessionActionRole(null, null)).toBe("player");
  });
});

describe("resolveReturnToSessionTone", () => {
  it("nominal: player return is green like « Rejoindre la session »", () => {
    expect(resolveReturnToSessionTone("player")).toBe("green");
  });

  it("nominal: GM return stays yellow like « Lancer une session »", () => {
    expect(resolveReturnToSessionTone("gm")).toBe("yellow");
  });
});

describe("shouldShowLobbyOpenIndicator", () => {
  it("nominal: lobby open while in session shows the « en cours » state", () => {
    expect(shouldShowLobbyOpenIndicator(true, true)).toBe(true);
  });

  it("edge: lobby closed falls back to the regular label", () => {
    expect(shouldShowLobbyOpenIndicator(true, false)).toBe(false);
  });

  it("guard: stale open flag out of session never shows the indicator", () => {
    expect(shouldShowLobbyOpenIndicator(false, true)).toBe(false);
  });
});
