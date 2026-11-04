import { describe, expect, it } from "vitest";
import { canConfirmLeaveSession, getLeaveSessionDescriptionKey } from "@/components/dialogs/ConfirmLeaveSessionDialog";
import { getSessionExitLayout } from "@/components/dialogs/SessionExitActions";

describe("FR-session-lobby-modal — session exit actions", () => {
  it("nominal: player gets a single red leave button", () => {
    expect(getSessionExitLayout(false, true)).toBe("leave");
  });

  it("nominal: GM gets « Clôturer » with « Quitter » in the arrow menu", () => {
    expect(getSessionExitLayout(true, true)).toBe("closeWithLeaveMenu");
  });

  it("edge: GM without close available falls back to the leave button", () => {
    expect(getSessionExitLayout(true, false)).toBe("leave");
  });

  it("nominal: description mentions group removal only for a player", () => {
    expect(getLeaveSessionDescriptionKey(false)).toBe("descriptionPlayer");
    expect(getLeaveSessionDescriptionKey(true)).toBe("descriptionGm");
  });

  it("failure: confirm is blocked while a leave is in progress", () => {
    expect(canConfirmLeaveSession(true)).toBe(false);
    expect(canConfirmLeaveSession(false)).toBe(true);
  });
});
