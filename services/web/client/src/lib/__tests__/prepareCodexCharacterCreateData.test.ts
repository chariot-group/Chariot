import { describe, expect, it } from "vitest";
import { prepareCodexCharacterCreateData } from "@/lib/prepareCodexCharacterCreateData";

describe("prepareCodexCharacterCreateData", () => {
  it("nominal: campaign group id is applied to an NPC draft", () => {
    const prepared = prepareCodexCharacterCreateData(
      { kind: "npc", draft: { firstname: "Wolf", groups: [] } },
      { groupId: "group-42", linkedPlayerId: null },
    );
    expect(prepared.groups).toEqual(["group-42"]);
  });

  it("edge: companion flow sets linkedPlayerId on NPC", () => {
    const prepared = prepareCodexCharacterCreateData(
      { kind: "npc", draft: { firstname: "Familiar" } },
      { linkedPlayerId: "player-1" },
    );
    expect("linkedPlayerId" in prepared && prepared.linkedPlayerId).toBe("player-1");
  });

  it("edge: player space keeps empty groups when no group context", () => {
    const prepared = prepareCodexCharacterCreateData(
      { kind: "player", draft: { firstname: "Hero", groups: [] } },
      {},
    );
    expect(prepared.groups).toEqual([]);
  });
});
