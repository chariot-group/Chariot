import { describe, it, expect } from "vitest";
import { findActiveCampaignSession, isSessionStillActive } from "@/lib/findActiveCampaignSession";
import type { SessionEntity } from "@/services/SessionService";

const now = new Date("2026-11-04T12:00:00Z");

const makeSession = (overrides: Partial<SessionEntity> = {}): SessionEntity => ({
  id: "s1",
  code: "ABC123",
  status: "launched",
  creatorUserId: "gm",
  creatorCampaignId: "camp",
  expiresAt: "2026-11-04T18:00:00Z",
  deletedAt: null,
  createdAt: "2026-11-04T10:00:00Z",
  updatedAt: "2026-11-04T10:00:00Z",
  participants: [],
  ...overrides,
});

describe("findActiveCampaignSession", () => {
  it("nominal: returns the launched, non-expired session of the GM's campaign", () => {
    const session = makeSession();
    expect(findActiveCampaignSession([session], "camp", "gm", now)).toBe(session);
  });

  it("edge: returns a lobby session without expiresAt", () => {
    const session = makeSession({ status: "activated", expiresAt: null });
    expect(findActiveCampaignSession([session], "camp", "gm", now)).toBe(session);
  });

  it("guard: ignores expired, closed, other campaigns and sessions created by someone else", () => {
    const sessions = [
      makeSession({ expiresAt: "2026-11-04T11:00:00Z" }),
      makeSession({ status: "closed" }),
      makeSession({ creatorCampaignId: "other" }),
      makeSession({ creatorUserId: "player" }),
      makeSession({ status: "launched", expiresAt: null }),
    ];
    expect(findActiveCampaignSession(sessions, "camp", "gm", now)).toBeNull();
  });
});

describe("isSessionStillActive", () => {
  it("nominal: launched session before expiry is active", () => {
    expect(isSessionStillActive(makeSession(), now)).toBe(true);
  });

  it("edge: expired launched session is no longer active", () => {
    expect(isSessionStillActive(makeSession({ expiresAt: "2026-11-04T11:59:59Z" }), now)).toBe(false);
  });

  it("guard: closed session is never active", () => {
    expect(isSessionStillActive(makeSession({ status: "closed" }), now)).toBe(false);
  });
});
