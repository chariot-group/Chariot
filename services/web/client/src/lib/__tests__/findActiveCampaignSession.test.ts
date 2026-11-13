import { describe, it, expect } from "vitest";
import {
  findActiveCampaignSession,
  hasJoinedPlayer,
  isLaunchedSessionStillActive,
  shouldGmReturnToSession,
  isSessionStillActive,
  resolveLastLeftSessionCode,
} from "@/lib/findActiveCampaignSession";
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

describe("isLaunchedSessionStillActive (joueur, « Retour en session »)", () => {
  it("nominal: launched, non-expired session offers a return", () => {
    expect(isLaunchedSessionStillActive(makeSession(), now)).toBe(true);
  });

  it("edge: lobby never launched does not offer a return (GM sees « Lancer une session »)", () => {
    expect(isLaunchedSessionStillActive(makeSession({ status: "activated", expiresAt: null }), now)).toBe(false);
  });

  it("edge: launched session past its expiry does not offer a return", () => {
    expect(isLaunchedSessionStillActive(makeSession({ expiresAt: "2026-11-04T11:00:00Z" }), now)).toBe(false);
  });

  it("guard: no session (lookup failed or none found) does not offer a return", () => {
    expect(isLaunchedSessionStillActive(null, now)).toBe(false);
  });

  it("guard: closed session does not offer a return", () => {
    expect(isLaunchedSessionStillActive(makeSession({ status: "closed" }), now)).toBe(false);
  });
});

describe("resolveLastLeftSessionCode", () => {
  it("nominal: leaving a launched session remembers its code", () => {
    expect(resolveLastLeftSessionCode("ABC123", true)).toBe("ABC123");
  });

  it("edge: leaving a never-launched lobby resets the remembered code", () => {
    expect(resolveLastLeftSessionCode("ABC123", false)).toBeNull();
  });

  it("guard: missing code is never remembered", () => {
    expect(resolveLastLeftSessionCode(null, true)).toBeNull();
    expect(resolveLastLeftSessionCode("", true)).toBeNull();
  });
});

const participant = (userId: string, status: "connected" | "disconnected" | "gameMaster") => ({
  id: `p-${userId}`,
  userId,
  characterId: null,
  status,
  joinedAt: "2026-11-04T10:00:00Z",
  sessionId: "s1",
});

describe("shouldGmReturnToSession (MJ, « Retour en session » vs « Lancer une session »)", () => {
  it("nominal: launched session offers a return", () => {
    expect(shouldGmReturnToSession(makeSession({ participants: [participant("gm", "gameMaster")] }), "gm", now)).toBe(true);
  });

  it("nominal: lobby joined by a player offers a return even before launch", () => {
    const lobby = makeSession({
      status: "activated",
      expiresAt: null,
      participants: [participant("gm", "gameMaster"), participant("p1", "connected")],
    });
    expect(shouldGmReturnToSession(lobby, "gm", now)).toBe(true);
  });

  it("edge: lobby whose only player is temporarily disconnected still offers a return", () => {
    const lobby = makeSession({ status: "activated", expiresAt: null, participants: [participant("p1", "disconnected")] });
    expect(shouldGmReturnToSession(lobby, "gm", now)).toBe(true);
  });

  it("edge: empty lobby never launched keeps « Lancer une session »", () => {
    const lobby = makeSession({ status: "activated", expiresAt: null, participants: [participant("gm", "gameMaster")] });
    expect(shouldGmReturnToSession(lobby, "gm", now)).toBe(false);
  });

  it("guard: no session, closed or expired session never offers a return", () => {
    const joined = [participant("p1", "connected")];
    expect(shouldGmReturnToSession(null, "gm", now)).toBe(false);
    expect(shouldGmReturnToSession(makeSession({ status: "closed", participants: joined }), "gm", now)).toBe(false);
    expect(shouldGmReturnToSession(makeSession({ expiresAt: "2026-11-04T11:00:00Z", participants: joined }), "gm", now)).toBe(false);
  });
});

describe("hasJoinedPlayer", () => {
  it("nominal: a non-GM participant counts as joined", () => {
    expect(hasJoinedPlayer([participant("gm", "gameMaster"), participant("p1", "connected")], "gm")).toBe(true);
  });

  it("edge: the GM alone (even listed with a non-GM status) does not count", () => {
    expect(hasJoinedPlayer([participant("gm", "connected")], "gm")).toBe(false);
  });

  it("guard: empty roster has no joined player", () => {
    expect(hasJoinedPlayer([], "gm")).toBe(false);
  });
});
