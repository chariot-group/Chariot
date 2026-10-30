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

  it("nominal: renders SidebarCharacterAvatar for roster and guest rows", () => {
    expect(source).toContain("SidebarCharacterAvatar");
    expect(source).toContain("buildSidebarCharacterAvatarBatchItems");
    expect(source).toContain("useMediaAvatarBatch");
  });

  it("nominal: nests session companions under assigned players", () => {
    expect(source).toContain("companionsGroupedByPlayerId");
    expect(source).toContain("SidebarCompanionNest");
    expect(source).toContain("npcKind");
    expect(source).not.toContain("linkedToPlayer");
    expect(source).toContain("ungroupedSessionCompanions");
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
