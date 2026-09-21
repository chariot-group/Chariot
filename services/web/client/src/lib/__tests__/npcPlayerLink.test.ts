import { describe, expect, it } from "vitest";
import {
  applyCompanionLinkChange,
  buildPlayerSidebarRows,
  linkedPlayerIdOf,
  isUnlinkedWithoutGroupNpc,
  playerSpaceNpcsForLinkPicker,
} from "@/lib/npcPlayerLink";
import type { Character, NPC } from "@/types/character";

const player = (id: string): Character =>
  ({
    _id: id,
    firstname: "Hero",
    lastname: id,
    groups: [],
    progression: {},
  }) as Character;

const npc = (id: string, linkedPlayerId?: string | null, groups: unknown[] = []): NPC =>
  ({
    _id: id,
    firstname: "Wolf",
    lastname: id,
    groups,
    linkedPlayerId: linkedPlayerId ?? null,
    challenge: { challengeRating: 1, experiencePoints: 200 },
  }) as NPC;

describe("FR-npc-player-link — player sidebar rows", () => {
  it("nominal: nests linked NPCs under their Player", () => {
    const rows = buildPlayerSidebarRows(
      [player("p1")],
      [],
      [npc("n1", "p1"), npc("n2", "p1")],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: "player", character: { _id: "p1" } });
    if (rows[0].type !== "player") throw new Error("expected player row");
    expect(rows[0].companions.map((c) => c._id)).toEqual(["n1", "n2"]);
  });

  it("edge: unlinked without-group NPCs appear as root rows", () => {
    const rows = buildPlayerSidebarRows([player("p1")], [npc("n-root")], [npc("n-linked", "p1")]);

    expect(rows.map((row) => (row.type === "player" ? row.character._id : row.character._id))).toEqual([
      "p1",
      "n-root",
    ]);
  });

  it("edge: a linked NPC is not also a root row", () => {
    const linked = npc("n1", "p1");
    const rows = buildPlayerSidebarRows([player("p1")], [linked], [linked]);

    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("player");
  });

  it("failure: empty linkedPlayerId is treated as unlinked", () => {
    expect(linkedPlayerIdOf(npc("n1", "  "))).toBeNull();
    expect(isUnlinkedWithoutGroupNpc(npc("n1", null))).toBe(true);
    expect(isUnlinkedWithoutGroupNpc(npc("n1", "p1"))).toBe(false);
  });
});

describe("FR-npc-player-link — applyCompanionLinkChange", () => {
  it("nominal: linking an NPC appends it to the companions list", () => {
    const linked = npc("n2", "p1");
    const next = applyCompanionLinkChange([npc("n1", "p1")], linked, "p1");
    expect(next.map((item) => item._id)).toEqual(["n1", "n2"]);
  });

  it("nominal: unlinking an NPC removes it from the companions list", () => {
    const next = applyCompanionLinkChange(
      [npc("n1", "p1"), npc("n2", "p1")],
      npc("n1", null),
      "p1",
    );
    expect(next.map((item) => item._id)).toEqual(["n2"]);
  });

  it("edge: updating an already linked NPC replaces it in place", () => {
    const original = npc("n1", "p1");
    const updated = { ...original, firstname: "Bear" } as NPC;
    const next = applyCompanionLinkChange([original], updated, "p1");
    expect(next).toHaveLength(1);
    expect(next[0].firstname).toBe("Bear");
  });

  it("failure: unlinking an NPC absent from the list is a no-op", () => {
    const current = [npc("n1", "p1")];
    const next = applyCompanionLinkChange(current, npc("n-missing", null), "p1");
    expect(next.map((item) => item._id)).toEqual(["n1"]);
  });
});

describe("FR-npc-player-link — playerSpaceNpcsForLinkPicker", () => {
  it("nominal: keeps unlinked NPCs without a group", () => {
    const next = playerSpaceNpcsForLinkPicker([npc("n1"), npc("n2")]);
    expect(next.map((item) => item._id)).toEqual(["n1", "n2"]);
  });

  it("edge: excludes NPCs already linked to a Player", () => {
    const next = playerSpaceNpcsForLinkPicker([npc("n1"), npc("n-linked", "p1")]);
    expect(next.map((item) => item._id)).toEqual(["n1"]);
  });

  it("failure: excludes NPCs that belong to a campaign group", () => {
    const grouped = npc("n-gm", null, [{ _id: "g1" }]);
    const next = playerSpaceNpcsForLinkPicker([npc("n1"), grouped]);
    expect(next.map((item) => item._id)).toEqual(["n1"]);
  });
});
