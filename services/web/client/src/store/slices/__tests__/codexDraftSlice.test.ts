import { describe, expect, it } from "vitest";
import codexDraftReducer, {
  clearCodexDrafts,
  setNpcCodexDraft,
  setPlayerCodexDraft,
} from "@/store/slices/codexDraftSlice";
import type { NPC, Player } from "@/types/character";

describe("FR-codex-npc-search-entity-type — kind-preserving drafts", () => {
  it("nominal: storing a Player draft clears any NPC draft", () => {
    let state = codexDraftReducer(undefined, setNpcCodexDraft({ firstname: "Goblin" } as Partial<NPC>));
    state = codexDraftReducer(state, setPlayerCodexDraft({ firstname: "Aragorn" } as Partial<Player>));

    expect(state.playerDraft?.firstname).toBe("Aragorn");
    expect(state.npcDraft).toBeNull();
  });

  it("edge: clearCodexDrafts empties both drafts", () => {
    let state = codexDraftReducer(undefined, setPlayerCodexDraft({ firstname: "Aragorn" } as Partial<Player>));
    state = codexDraftReducer(state, clearCodexDrafts());

    expect(state.npcDraft).toBeNull();
    expect(state.playerDraft).toBeNull();
  });
});
