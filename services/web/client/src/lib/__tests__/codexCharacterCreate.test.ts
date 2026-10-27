import { describe, expect, it } from "vitest";
import {
  buildCodexDraftFormPath,
  buildCreateCharacterPath,
  campaignContextFromParams,
  buildCodexPreselectionPath,
  linkedCreateCodexEntityLock,
  parseCodexPreselection,
  parseCodexSelectionKey,
  resolveCodexCreateSelection,
  resolvePreselectionLang,
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

describe("FR-codex-share-link-preselection — link params", () => {
  it("nominal: valid player and monster links are parsed", () => {
    expect(parseCodexPreselection("65f1a2b3c4d5e6f7a8b9c0d1", "player", "fr")).toEqual({
      kind: "player",
      id: "65f1a2b3c4d5e6f7a8b9c0d1",
      lang: "fr",
    });
    expect(parseCodexPreselection("abc-123", "monster", null)).toEqual({
      kind: "monster",
      id: "abc-123",
      lang: null,
    });
  });

  it("edge: unsupported lang is dropped, link stays valid", () => {
    expect(parseCodexPreselection("abc", "player", "de")?.lang).toBeNull();
    expect(parseCodexPreselection("abc", "player", " EN ")?.lang).toBe("en");
  });

  it("failure: missing/invalid kind or unsafe id falls back to normal search", () => {
    expect(parseCodexPreselection("abc", null, "fr")).toBeNull();
    expect(parseCodexPreselection("abc", "npc", "fr")).toBeNull();
    expect(parseCodexPreselection("", "player", "fr")).toBeNull();
    expect(parseCodexPreselection(undefined, "player", "fr")).toBeNull();
    expect(parseCodexPreselection("../etc", "player", "fr")).toBeNull();
    expect(parseCodexPreselection("a".repeat(65), "player", "fr")).toBeNull();
  });
});

describe("FR-codex-share-link-preselection — language resolution", () => {
  it("nominal: link lang wins when the entry has it", () => {
    expect(resolvePreselectionLang({ requested: "es", userLocale: "fr", available: ["fr", "es"] })).toBe("es");
  });

  it("edge: falls back to user locale, then en, then first language", () => {
    expect(resolvePreselectionLang({ requested: "es", userLocale: "fr", available: ["fr", "en"] })).toBe("fr");
    expect(resolvePreselectionLang({ requested: null, userLocale: "es", available: ["en", "fr"] })).toBe("en");
    expect(resolvePreselectionLang({ requested: null, userLocale: "es", available: ["fr"] })).toBe("fr");
  });

  it("failure: entry without languages resolves to null", () => {
    expect(resolvePreselectionLang({ requested: "fr", userLocale: "fr", available: [] })).toBeNull();
  });
});

describe("FR-codex-share-link-preselection — URL mirroring", () => {
  it("nominal: previewed entry maps to its shareable path", () => {
    expect(buildCodexPreselectionPath("fr", { kind: "player", id: "abc123", lang: "fr" })).toBe(
      "/fr/characters/new/codex/abc123?kind=player&lang=fr",
    );
    expect(buildCodexPreselectionPath("en", { kind: "monster", id: "m1" })).toBe(
      "/en/characters/new/codex/m1?kind=monster",
    );
  });

  it("edge: no entry restores the base path", () => {
    expect(buildCodexPreselectionPath("fr", null)).toBe("/fr/characters/new/codex");
  });

  it("nominal: selection key round-trips to a link that parses back", () => {
    const entry = parseCodexSelectionKey("player:abc123:es");
    expect(entry).toEqual({ kind: "player", id: "abc123", lang: "es" });
    const url = new URL(buildCodexPreselectionPath("fr", entry), "http://localhost");
    expect(
      parseCodexPreselection(
        url.pathname.split("/").pop(),
        url.searchParams.get("kind"),
        url.searchParams.get("lang"),
      ),
    ).toEqual({ kind: "player", id: "abc123", lang: "es" });
  });

  it("failure: empty or malformed key yields no entry", () => {
    expect(parseCodexSelectionKey(null)).toBeNull();
    expect(parseCodexSelectionKey("npc:abc:fr")).toBeNull();
    expect(parseCodexSelectionKey("player")).toBeNull();
  });
});
