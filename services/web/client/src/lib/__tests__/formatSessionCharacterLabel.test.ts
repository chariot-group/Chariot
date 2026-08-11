import { describe, expect, it } from "vitest";
import {
  formatSessionCharacterDisplayName,
  resolveSessionCharacterLabel,
} from "@/lib/formatSessionCharacterLabel";
import { SESSION_PARTICIPANT_NAME_LOADING } from "@/lib/formatSessionParticipantUserLabel";

/** @see FR-session-participant-labels: Assigned Character Identity */
describe("FR-session-participant-labels — session character labels", () => {
  it("nominal: formats firstname + lastname", () => {
    expect(
      formatSessionCharacterDisplayName({
        firstname: "Lyra",
        lastname: "Stormwind",
      }),
    ).toBe("Lyra Stormwind");
  });

  it("edge: firstname only when lastname absent", () => {
    expect(formatSessionCharacterDisplayName({ firstname: "Lyra", lastname: "" })).toBe("Lyra");
  });

  it("edge: falls back to surname when names empty", () => {
    expect(
      formatSessionCharacterDisplayName({
        firstname: "  ",
        lastname: "",
        surname: "Shadowblade",
      }),
    ).toBe("Shadowblade");
  });

  it("failure: returns null when no usable name parts", () => {
    expect(formatSessionCharacterDisplayName({ firstname: "", lastname: "" })).toBeNull();
    expect(formatSessionCharacterDisplayName(null)).toBeNull();
  });

  it("nominal: resolveSessionCharacterLabel never returns a technical id", () => {
    expect(
      resolveSessionCharacterLabel({
        firstname: "Lyra",
        lastname: "Stormwind",
      }),
    ).toBe("Lyra Stormwind");
    expect(resolveSessionCharacterLabel(undefined)).toBe(SESSION_PARTICIPANT_NAME_LOADING);
    expect(resolveSessionCharacterLabel({})).toBe(SESSION_PARTICIPANT_NAME_LOADING);
  });
});
