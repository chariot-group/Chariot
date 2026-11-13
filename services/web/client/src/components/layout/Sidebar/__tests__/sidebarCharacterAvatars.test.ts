import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/** @see FR-sidebar-character-avatars */
describe("FR-sidebar-character-avatars — sidebar lists", () => {
  it("nominal: Player-space list renders SidebarCharacterAvatar with batch hook", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/layout/Sidebar/CharactersWithoutGroupList.tsx"),
      "utf8",
    );
    expect(source).toContain("SidebarCharacterAvatar");
    expect(source).toContain("buildSidebarCharacterAvatarBatchItems");
    expect(source).toContain("useMediaAvatarBatch");
    expect(source).not.toContain("classLabel");
    expect(source).toContain("truncateForSidebarMenuLabel");
    expect(source).toContain("unlinkNpcMenuLabels");
  });

  it("nominal: GM GroupList renders SidebarCharacterAvatar with batch hook", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/layout/Sidebar/GroupList.tsx"),
      "utf8",
    );
    expect(source).toContain("SidebarCharacterAvatar");
    expect(source).toContain("buildSidebarCharacterAvatarBatchItems");
    expect(source).toContain("useMediaAvatarBatch");
  });
});
