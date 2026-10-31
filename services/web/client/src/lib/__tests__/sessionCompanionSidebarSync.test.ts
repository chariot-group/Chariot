import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RootState } from "@/store";
import {
  isCachedPlayerLinkedNpcId,
  isDerivedSessionCompanionId,
  refreshCompanionSidebarCachesFromRemoteSheet,
  shouldRefreshCompanionSidebarCaches,
} from "@/lib/sessionCompanionSidebarSync";
import type { NPC } from "@/types/character";

const getCharacterByIdMock = vi.fn();

vi.mock("@/services/CharacterService", () => ({
  default: {
    getCharacterById: (...args: unknown[]) => getCharacterByIdMock(...args),
  },
}));

const companion = (id: string, name: string): NPC =>
  ({
    _id: id,
    kind: "npc",
    firstname: name,
    linkedPlayerId: "pj-1",
  }) as NPC;

const baseState = (): RootState =>
  ({
    session: { sessionCompanionNpcs: [companion("npc-1", "Old")] },
    character: { linkedNpcs: [companion("npc-2", "Linked")] },
  }) as unknown as RootState;

describe("FR-session-player-companion-combatants — sessionCompanionSidebarSync", () => {
  beforeEach(() => {
    getCharacterByIdMock.mockReset();
  });

  it("nominal: detects session companion and linked NPC ids", () => {
    const state = baseState();
    expect(isDerivedSessionCompanionId(state, "npc-1")).toBe(true);
    expect(isCachedPlayerLinkedNpcId(state, "npc-2")).toBe(true);
    expect(shouldRefreshCompanionSidebarCaches(state, "npc-1")).toBe(true);
    expect(shouldRefreshCompanionSidebarCaches(state, "unknown")).toBe(false);
  });

  it("nominal: refresh updates session and player caches from API", async () => {
    getCharacterByIdMock.mockResolvedValue(companion("npc-1", "New"));
    const dispatch = vi.fn();
    const getState = vi.fn(() => baseState());

    await refreshCompanionSidebarCachesFromRemoteSheet(
      "npc-1",
      "ABC123",
      dispatch as never,
      getState,
    );

    expect(getCharacterByIdMock).toHaveBeenCalledWith("npc-1", { sessionCode: "ABC123" });
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it("nominal: linked-only id updates player space cache", async () => {
    getCharacterByIdMock.mockResolvedValue(companion("npc-2", "Renamed"));
    const dispatch = vi.fn();

    await refreshCompanionSidebarCachesFromRemoteSheet(
      "npc-2",
      "ABC123",
      dispatch as never,
      () => baseState(),
    );

    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it("failure: skips fetch when id is not in sidebar caches", async () => {
    const dispatch = vi.fn();
    await refreshCompanionSidebarCachesFromRemoteSheet(
      "other",
      "ABC123",
      dispatch as never,
      () => baseState(),
    );
    expect(getCharacterByIdMock).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
