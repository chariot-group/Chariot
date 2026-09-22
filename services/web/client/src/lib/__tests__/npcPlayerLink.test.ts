import { describe, expect, it } from "vitest";
import {
  applyCompanionLinkChange,
  buildPlayerSidebarRows,
  linkedPlayerIdOf,
  isUnlinkedWithoutGroupNpc,
  npcLinkedPlayerUpdatePayload,
  npcSheetHeaderIdentity,
  persistSidebarNpcLinkedPlayer,
  playerSpaceNpcsForLinkPicker,
  playerSpaceSidebarActionIds,
  playersForNpcLinkPicker,
  queueCompanionLinkOp,
  requiresNpcLinkReassignmentConfirm,
  sidebarNpcLinkActions,
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

describe("FR-npc-player-link — queueCompanionLinkOp", () => {
  it("nominal: selecting an NPC queues a link without replacing other ops", () => {
    const next = queueCompanionLinkOp([], npc("n2"), "p1", null);
    expect(next).toEqual([{ npc: npc("n2"), linkedPlayerId: "p1" }]);
  });

  it("edge: linking then unlinking a previously unlinked NPC drops the op", () => {
    const linked = queueCompanionLinkOp([], npc("n2"), "p1", null);
    const next = queueCompanionLinkOp(linked, npc("n2"), null, null);
    expect(next).toEqual([]);
  });

  it("edge: unlinking a saved companion then linking it again drops the op", () => {
    const unlinked = queueCompanionLinkOp([], npc("n1", "p1"), null, "p1");
    const next = queueCompanionLinkOp(unlinked, npc("n1", "p1"), "p1", "p1");
    expect(next).toEqual([]);
  });

  it("failure: empty linkedPlayerId is treated as unlinked", () => {
    const next = queueCompanionLinkOp([], npc("n2"), "  ", null);
    expect(next).toEqual([]);
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

describe("FR-npc-player-link — npcSheetHeaderIdentity", () => {
  it("nominal: maps name, surname, fractional CR, XP, and group label", () => {
    const companion = {
      ...npc("n1", "p1", [{ _id: "g1", label: " Wolves " }]),
      surname: "Shadowfang",
      challenge: { challengeRating: 0.25, experiencePoints: 50 },
    } as NPC;

    expect(npcSheetHeaderIdentity(companion, "PNJ sans nom")).toEqual({
      fullName: "Wolf n1",
      surname: "Shadowfang",
      formattedChallengeRating: "1/4",
      experiencePoints: 50,
      groupLabel: "Wolves",
    });
  });

  it("edge: empty name uses the fallback and omits blank surname", () => {
    const companion = {
      ...npc("n1"),
      firstname: "  ",
      lastname: "",
      surname: "   ",
    } as NPC;

    expect(npcSheetHeaderIdentity(companion, "PNJ sans nom")).toMatchObject({
      fullName: "PNJ sans nom",
      surname: null,
    });
  });

  it("failure: missing challenge and group yield zero CR/XP and no group label", () => {
    const companion = {
      ...npc("n1"),
      challenge: undefined,
      groups: [{ _id: "g1", label: "   " }],
    } as unknown as NPC;

    expect(npcSheetHeaderIdentity(companion, "PNJ sans nom")).toEqual({
      fullName: "Wolf n1",
      surname: null,
      formattedChallengeRating: "0",
      experiencePoints: 0,
      groupLabel: null,
    });
  });
});

describe("FR-sidebar-npc-link — sidebarNpcLinkActions", () => {
  it("nominal: unlinked NPC exposes link; linked NPC exposes unlink and reassign", () => {
    expect(sidebarNpcLinkActions(npc("n1"))).toEqual(["link"]);
    expect(sidebarNpcLinkActions(npc("n1", "p1"))).toEqual(["unlink", "reassign"]);
    expect(playerSpaceSidebarActionIds(npc("n1"), { actionsDisabled: false })).toEqual([
      "exportPdf",
      "link",
      "duplicate",
      "edit",
      "delete",
    ]);
  });

  it("edge: launched session keeps only PDF export", () => {
    expect(playerSpaceSidebarActionIds(npc("n1"), { actionsDisabled: true })).toEqual(["exportPdf"]);
    expect(
      playerSpaceSidebarActionIds(npc("n1", "p1"), { actionsDisabled: false }),
    ).toEqual(["exportPdf", "unlink", "reassign", "duplicate", "edit", "delete"]);
  });

  it("failure: Player rows and NPCs without id get no link actions", () => {
    expect(sidebarNpcLinkActions(player("p1"))).toEqual([]);
    expect(sidebarNpcLinkActions(npc(""))).toEqual([]);
    expect(playerSpaceSidebarActionIds(player("p1"), { actionsDisabled: false })).toEqual([
      "exportPdf",
      "duplicate",
      "edit",
      "delete",
    ]);
  });
});

describe("FR-sidebar-npc-link — playersForNpcLinkPicker", () => {
  it("nominal: lists visible Players sorted by display name", () => {
    const next = playersForNpcLinkPicker([player("p2"), player("p1")]);
    expect(next.map((item) => item._id)).toEqual(["p1", "p2"]);
  });

  it("edge: reassignment excludes the currently linked Player", () => {
    const next = playersForNpcLinkPicker([player("p1"), player("p2")], { excludePlayerId: "p1" });
    expect(next.map((item) => item._id)).toEqual(["p2"]);
  });

  it("failure: drops NPCs, blank ids, and empty next-player reassignment", () => {
    expect(playersForNpcLinkPicker([npc("n1"), player("p1"), { ...player("p0"), _id: "" }]).map((item) => item._id)).toEqual(
      ["p1"],
    );
    expect(requiresNpcLinkReassignmentConfirm("p1", "p2")).toBe(true);
    expect(requiresNpcLinkReassignmentConfirm("p1", "p1")).toBe(false);
    expect(requiresNpcLinkReassignmentConfirm(null, "p2")).toBe(false);
    expect(requiresNpcLinkReassignmentConfirm("p1", "  ")).toBe(false);
    expect(npcLinkedPlayerUpdatePayload("  ")).toEqual({ linkedPlayerId: null });
    expect(npcLinkedPlayerUpdatePayload("p1")).toEqual({ linkedPlayerId: "p1" });
  });
});

describe("FR-sidebar-npc-link — persistSidebarNpcLinkedPlayer", () => {
  it("nominal: patches linkedPlayerId on the NPC", async () => {
    const updated = npc("n1", "p1");
    const updateNpc = async (id: string, payload: { linkedPlayerId: string | null }) => {
      expect(id).toBe("n1");
      expect(payload).toEqual({ linkedPlayerId: "p1" });
      return updated;
    };

    await expect(persistSidebarNpcLinkedPlayer(npc("n1"), "p1", updateNpc)).resolves.toEqual(updated);
  });

  it("edge: blank linkedPlayerId unlinks", async () => {
    const updateNpc = async (_id: string, payload: { linkedPlayerId: string | null }) => {
      expect(payload).toEqual({ linkedPlayerId: null });
      return npc("n1", null);
    };

    await persistSidebarNpcLinkedPlayer(npc("n1", "p1"), "  ", updateNpc);
  });

  it("failure: missing NPC id rejects without calling the API", async () => {
    const updateNpc = async () => {
      throw new Error("should-not-call");
    };

    await expect(persistSidebarNpcLinkedPlayer(npc(""), "p1", updateNpc)).rejects.toThrow("missing-npc-id");
  });

  it("failure: update API rejection propagates", async () => {
    const updateNpc = async () => {
      throw new Error("api-down");
    };

    await expect(persistSidebarNpcLinkedPlayer(npc("n1"), "p1", updateNpc)).rejects.toThrow("api-down");
  });
});
