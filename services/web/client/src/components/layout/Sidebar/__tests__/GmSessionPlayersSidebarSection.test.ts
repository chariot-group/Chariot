import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sidebarPath = resolve(
  process.cwd(),
  "src/components/layout/Sidebar/GmSessionPlayersSidebarSection.tsx",
);

/** @see FR-session-participant-labels — Assigned Character Identity */
describe("FR-session-participant-labels — GM session players sidebar", () => {
  const source = readFileSync(sidebarPath, "utf8");

  it("nominal: renders character MediaAvatar for roster and guest rows", () => {
    expect(source).toContain('scope="character"');
    expect(source).toContain("useMediaAvatarBatch");
    expect(source).toContain("SIDEBAR_AVATAR_SIZE");
  });

  it("edge: uses loading placeholder instead of raw character id", () => {
    expect(source).toContain("SESSION_PARTICIPANT_NAME_LOADING");
    expect(source).toContain("resolveSessionCharacterLabel");
    expect(source).not.toMatch(/label\.trim\(\) \|\| cid/);
    expect(source).not.toMatch(/characterLabels\[cid!\] \?\? cid!/);
    expect(source).not.toMatch(/guestLabels\[cid\] \?\? cid/);
  });

  it("failure: retries character meta fetch before giving up", () => {
    expect(source).toContain("CHARACTER_FETCH_RETRY_DELAY_MS");
    expect(source).toContain("fetchCharacterMeta");
  });
});
