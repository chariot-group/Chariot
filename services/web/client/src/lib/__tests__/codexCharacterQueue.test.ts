import { describe, expect, it } from "vitest";
import {
  toggleCharacterInQueue,
  queuedCharacterKeys,
  isCharacterQueued,
  queueEntriesNewestFirst,
} from "@/lib/codexCharacterQueue";
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

  it("nominal: display lists the last added entry first and the first added last", () => {
    const withA = toggleCharacterInQueue([], "monster:a:fr", npcSelection);
    const withAB = toggleCharacterInQueue(withA, "player:b:fr", playerSelection);
    const withABC = toggleCharacterInQueue(withAB, "monster:c:fr", npcSelection);

    expect(queueEntriesNewestFirst(withABC).map((entry) => entry.key)).toEqual([
      "monster:c:fr",
      "player:b:fr",
      "monster:a:fr",
    ]);
  });

  it("edge: display order does not mutate the queue used for batch creation", () => {
    const withA = toggleCharacterInQueue([], "monster:a:fr", npcSelection);
    const withAB = toggleCharacterInQueue(withA, "player:b:fr", playerSelection);

    queueEntriesNewestFirst(withAB);

    expect(withAB.map((entry) => entry.key)).toEqual(["monster:a:fr", "player:b:fr"]);
  });

  it("edge: removing then re-adding an entry moves it back to the top", () => {
    const withAB = toggleCharacterInQueue(
      toggleCharacterInQueue([], "monster:a:fr", npcSelection),
      "player:b:fr",
      playerSelection,
    );
    const readdedA = toggleCharacterInQueue(
      toggleCharacterInQueue(withAB, "monster:a:fr", npcSelection),
      "monster:a:fr",
      npcSelection,
    );

    expect(queueEntriesNewestFirst(readdedA)[0]?.key).toBe("monster:a:fr");
  });

  it("failure guard: empty queue displays nothing", () => {
    expect(queueEntriesNewestFirst([])).toEqual([]);
  });
});
