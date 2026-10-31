import { describe, expect, it } from "vitest";
import {
  buildCodexDraftFormPath,
  buildCreateCharacterPath,
  campaignContextFromParams,
  linkedCreateCodexEntityLock,
  resolveCodexCreateSelection,
} from "@/lib/codexCharacterCreate";
import type { NPC, Player } from "@/types/character";

describe("FR-player-space-codex-character-creation — create paths", () => {
  const campaign = { campaignId: "camp-1", groupId: "group-1" };

  it("nominal: campaign dialog choices keep existing campaign routes", () => {
    expect(buildCreateCharacterPath("players", campaign)).toBe(
      "/campaigns/camp-1/groups/group-1/characters/new/players",
    );
    expect(buildCreateCharacterPath("npcs", campaign)).toBe(
      "/campaigns/camp-1/groups/group-1/characters/new/npcs",
    );
    expect(buildCreateCharacterPath("codex", campaign)).toBe(
      "/campaigns/camp-1/groups/group-1/characters/new/npcs-codex",
    );
  });

  it("nominal: player-space dialog choices use without-group routes", () => {
    expect(buildCreateCharacterPath("players")).toBe("/characters/new/players");
    expect(buildCreateCharacterPath("npcs")).toBe("/characters/new/npcs");
    expect(buildCreateCharacterPath("codex")).toBe("/characters/new/codex");
  });

  it("nominal: Codex confirm routes by preserved kind", () => {
    expect(buildCodexDraftFormPath("npc", campaign)).toBe(
      "/campaigns/camp-1/groups/group-1/characters/new/npcs?fromCodex=1",
    );
    expect(buildCodexDraftFormPath("player")).toBe("/characters/new/players?fromCodex=1");
  });

  it("nominal: linked-NPC create keeps linkedPlayerId on NPC and Codex routes", () => {
    expect(buildCreateCharacterPath("npcs", undefined, { linkedPlayerId: "p1" })).toBe(
      "/characters/new/npcs?linkedPlayerId=p1",
    );
    expect(buildCreateCharacterPath("codex", undefined, { linkedPlayerId: "p1" })).toBe(
      "/characters/new/codex?linkedPlayerId=p1",
    );
    expect(buildCodexDraftFormPath("npc", undefined, { linkedPlayerId: "p1" })).toBe(
      "/characters/new/npcs?fromCodex=1&linkedPlayerId=p1",
    );
  });

  it("failure: linkedPlayerId is not applied to a Codex Player draft", () => {
    expect(buildCodexDraftFormPath("player", undefined, { linkedPlayerId: "p1" })).toBe(
      "/characters/new/players?fromCodex=1",
    );
  });

  it("nominal: linked create locks Codex search to monsters", () => {
    expect(linkedCreateCodexEntityLock("p1")).toBe("monsters");
  });

  it("edge: blank linkedPlayerId does not lock Codex or pollute the query", () => {
    expect(linkedCreateCodexEntityLock("  ")).toBeUndefined();
    expect(buildCreateCharacterPath("codex", undefined, { linkedPlayerId: "  " })).toBe(
      "/characters/new/codex",
    );
  });

  it("edge: incomplete campaign params fall back to player space", () => {
    expect(campaignContextFromParams("camp-1")).toBeUndefined();
    expect(campaignContextFromParams(undefined, "group-1")).toBeUndefined();
  });
});

describe("FR-codex-npc-search-entity-type — kind-preserving selection", () => {
  it("nominal: premade player is not sent as an NPC draft", () => {
    const playerDraft = { firstname: "Aragorn" } as Partial<Player>;
    const npcDraft = { firstname: "Goblin" } as Partial<NPC>;

    expect(
      resolveCodexCreateSelection({
        entryKind: "player",
        npcDraft,
        playerDraft,
      }),
    ).toEqual({ kind: "player", draft: playerDraft });
  });

  it("nominal: monster stays an NPC draft", () => {
    const npcDraft = { firstname: "Goblin" } as Partial<NPC>;

    expect(
      resolveCodexCreateSelection({
        entryKind: "monster",
        npcDraft,
        playerDraft: null,
      }),
    ).toEqual({ kind: "npc", draft: npcDraft });
  });

  it("failure: missing draft for the selected kind yields no selection", () => {
    expect(
      resolveCodexCreateSelection({
        entryKind: "player",
        npcDraft: { firstname: "Goblin" } as Partial<NPC>,
        playerDraft: null,
      }),
    ).toBeNull();
  });
});
