/** @see FR-player-duplicate-companion-choice */

import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NPC } from "@/types/character";
import CharacterService from "@/services/CharacterService";
import {
  applyCompanionModeAfterPlayerCreated,
  effectiveDuplicateCompanionMode,
  syncReduxAfterCompanionMove,
  syncReduxAfterCompanionNpcCreate,
} from "@/lib/playerDuplicateCompanions";
import { upsertPlayerSpaceNpc } from "@/store/slices/characterSlice";
import { addCharacterToGroup } from "@/store/slices/groupSlice";

vi.mock("@/services/CharacterService", () => ({
  default: {
    getCharacterById: vi.fn(),
    createCharacter: vi.fn(),
    updateCharacter: vi.fn(),
  },
}));

const npc = (id: string, linkedPlayerId: string, groups: string[] = []): NPC =>
  ({
    _id: id,
    firstname: id,
    lastname: "",
    kind: "npc",
    linkedPlayerId,
    groups,
  }) as NPC;

describe("FR-player-duplicate-companion-choice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("nominal: effectiveDuplicateCompanionMode keeps copy and playerOnly for any count", () => {
    expect(effectiveDuplicateCompanionMode("copyCompanions", 3)).toBe("copyCompanions");
    expect(effectiveDuplicateCompanionMode("playerOnly", 2)).toBe("playerOnly");
  });

  it("edge: effectiveDuplicateCompanionMode downgrades move when count > 1", () => {
    expect(effectiveDuplicateCompanionMode("moveCompanions", 2)).toBe("playerOnly");
    expect(effectiveDuplicateCompanionMode("moveCompanions", 1)).toBe("moveCompanions");
  });

  it("nominal: syncReduxAfterCompanionNpcCreate upserts NPC and adds to groups", () => {
    const dispatch = vi.fn();
    const companion = npc("c-copy", "p-new", ["g1"]);

    syncReduxAfterCompanionNpcCreate(dispatch, companion);

    expect(dispatch).toHaveBeenCalledWith(upsertPlayerSpaceNpc(companion));
    expect(dispatch).toHaveBeenCalledWith(
      addCharacterToGroup({
        groupId: "g1",
        character: {
          _id: "c-copy",
          firstname: "c-copy",
          lastname: "",
          surname: undefined,
        },
      }),
    );
  });

  it("nominal: syncReduxAfterCompanionMove upserts reassigned NPCs", () => {
    const dispatch = vi.fn();
    const moved = npc("c1", "p-new");

    syncReduxAfterCompanionMove(dispatch, [moved]);

    expect(dispatch).toHaveBeenCalledWith(upsertPlayerSpaceNpc(moved));
  });

  it("nominal: applyCompanionModeAfterPlayerCreated moves companions when mode is moveCompanions", async () => {
    const companions = [npc("c1", "p-old")];
    vi.mocked(CharacterService.updateCharacter).mockResolvedValue(npc("c1", "p-new"));

    const result = await applyCompanionModeAfterPlayerCreated({
      mode: "moveCompanions",
      newPlayerId: "p-new",
      companions,
      existingNpcNames: ["c1"],
    });

    expect(CharacterService.updateCharacter).toHaveBeenCalledWith("npcs", "c1", {
      linkedPlayerId: "p-new",
    });
    expect(result.movedCompanions).toHaveLength(1);
    expect(result.createdCompanions).toHaveLength(0);
  });

  it("edge: applyCompanionModeAfterPlayerCreated skips NPC work in playerOnly mode", async () => {
    const result = await applyCompanionModeAfterPlayerCreated({
      mode: "playerOnly",
      newPlayerId: "p-new",
      companions: [npc("c1", "p-old")],
      existingNpcNames: [],
    });

    expect(CharacterService.createCharacter).not.toHaveBeenCalled();
    expect(CharacterService.updateCharacter).not.toHaveBeenCalled();
    expect(result.createdCompanions).toHaveLength(0);
    expect(result.movedCompanions).toHaveLength(0);
  });
});
