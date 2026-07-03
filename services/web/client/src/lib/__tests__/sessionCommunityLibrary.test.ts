import { describe, expect, it } from "vitest";
import { shouldShowSessionCommunityLibraryButton } from "@/lib/sessionCommunityLibrary";

/** @see FR-session-gm-codex-library */
describe("FR-session-gm-codex-library — header visibility", () => {
  it("nominal: shows for GM in session", () => {
    expect(shouldShowSessionCommunityLibraryButton(true, true)).toBe(true);
  });

  it("edge: hides for player in session", () => {
    expect(shouldShowSessionCommunityLibraryButton(true, false)).toBe(false);
  });

  it("failure: hides for GM outside session", () => {
    expect(shouldShowSessionCommunityLibraryButton(false, true)).toBe(false);
  });
});
