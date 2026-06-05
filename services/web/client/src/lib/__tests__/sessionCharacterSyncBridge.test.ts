import { describe, expect, it, vi } from "vitest";
import {
  emitCharacterSheetUpdated,
  registerLocalCharacterSheetUpdatedListener,
  registerSessionSyncSocket,
} from "../sessionCharacterSyncBridge";

describe("sessionCharacterSyncBridge — local sheet sync (FR-016)", () => {
  it("nominal: notifies the local listener when the GM saves a player sheet", () => {
    const localListener = vi.fn();
    registerLocalCharacterSheetUpdatedListener(localListener);

    const emit = vi.fn();
    registerSessionSyncSocket({ connected: true, emit } as never);

    emitCharacterSheetUpdated("ABC123", "char-42");

    expect(localListener).toHaveBeenCalledWith("char-42");
    expect(emit).toHaveBeenCalledWith("session:character-sheet-updated", {
      sessionId: "ABC123",
      characterId: "char-42",
    });

    registerLocalCharacterSheetUpdatedListener(null);
    registerSessionSyncSocket(null);
  });

  it("edge: still notifies locally when the socket is disconnected", () => {
    const localListener = vi.fn();
    registerLocalCharacterSheetUpdatedListener(localListener);
    registerSessionSyncSocket({ connected: false, emit: vi.fn() } as never);

    emitCharacterSheetUpdated("ABC123", "char-99");

    expect(localListener).toHaveBeenCalledWith("char-99");

    registerLocalCharacterSheetUpdatedListener(null);
    registerSessionSyncSocket(null);
  });

  it("edge: trims sessionCode and characterId before broadcasting", () => {
    const localListener = vi.fn();
    const emit = vi.fn();

    registerLocalCharacterSheetUpdatedListener(localListener);
    registerSessionSyncSocket({ connected: true, emit } as never);

    emitCharacterSheetUpdated("  ABC123  ", "  npc-7  ");

    expect(localListener).toHaveBeenCalledWith("npc-7");
    expect(emit).toHaveBeenCalledWith("session:character-sheet-updated", {
      sessionId: "ABC123",
      characterId: "npc-7",
    });

    registerLocalCharacterSheetUpdatedListener(null);
    registerSessionSyncSocket(null);
  });

  it("error: ignores empty characterId and does not call the listener", () => {
    const localListener = vi.fn();
    registerLocalCharacterSheetUpdatedListener(localListener);

    emitCharacterSheetUpdated("ABC123", "   ");

    expect(localListener).not.toHaveBeenCalled();

    registerLocalCharacterSheetUpdatedListener(null);
  });
});
