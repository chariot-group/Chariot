import { beforeEach, describe, expect, it, vi } from "vitest";
import { moveCharacterToGroup } from "@/lib/moveCharacterToGroup";
import CharacterService from "@/services/CharacterService";

vi.mock("@/services/CharacterService", () => ({
  default: {
    getCharacterById: vi.fn(),
    updateCharacter: vi.fn(),
  },
}));

describe("moveCharacterToGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("moves a player character to another active group", async () => {
    vi.mocked(CharacterService.getCharacterById).mockResolvedValue({
      _id: "char-1",
      progression: { level: 1, experience: 0 },
      groups: [{ _id: "group-a" }, { _id: "group-b" }],
    } as never);
    vi.mocked(CharacterService.updateCharacter).mockResolvedValue({} as never);

    await moveCharacterToGroup("char-1", "group-a", "group-c");

    expect(CharacterService.updateCharacter).toHaveBeenCalledWith("players", "char-1", {
      groups: ["group-b", "group-c"],
    });
  });

  it("moves an npc character using the npc endpoint", async () => {
    vi.mocked(CharacterService.getCharacterById).mockResolvedValue({
      _id: "npc-1",
      groups: ["group-a"],
    } as never);
    vi.mocked(CharacterService.updateCharacter).mockResolvedValue({} as never);

    await moveCharacterToGroup("npc-1", "group-a", "group-b");

    expect(CharacterService.updateCharacter).toHaveBeenCalledWith("npcs", "npc-1", {
      groups: ["group-b"],
    });
  });

  it("propagates API failures", async () => {
    vi.mocked(CharacterService.getCharacterById).mockRejectedValue(new Error("network"));

    await expect(moveCharacterToGroup("char-1", "group-a", "group-b")).rejects.toThrow("network");
  });
});
