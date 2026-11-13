import { describe, expect, it } from "vitest";
import { toggleCharacterInQueue, queuedCharacterKeys, isCharacterQueued } from "@/lib/codexCharacterQueue";
import type { CodexCreateSelection } from "@/lib/codexCharacterCreate";

const npcSelection: CodexCreateSelection = { kind: "npc", draft: { firstname: "Gobelin" } };
const playerSelection: CodexCreateSelection = { kind: "player", draft: { firstname: "Aragorn" } };

describe("codexCharacterQueue", () => {
  it("nominal: toggles an entry in and out of the queue", () => {
    const next = toggleCharacterInQueue([], "monster:m1:fr", npcSelection);
    expect(next).toHaveLength(1);
    const cleared = toggleCharacterInQueue(next, "monster:m1:fr", npcSelection);
    expect(cleared).toHaveLength(0);
  });

  it("edge: distinct keys keep NPC and player entries", () => {
    const withNpc = toggleCharacterInQueue([], "monster:m1:fr", npcSelection);
    const withBoth = toggleCharacterInQueue(withNpc, "player:p1:en", playerSelection);
    expect(queuedCharacterKeys(withBoth).size).toBe(2);
    expect(isCharacterQueued(withBoth, "player:p1:en")).toBe(true);
  });
});
