import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const detailPath = resolve(
  fileURLToPath(new URL("..", import.meta.url)),
  "CharacterDetailView.tsx",
);
const tabPath = resolve(
  fileURLToPath(new URL("../tabContents/companions", import.meta.url)),
  "CharacterCompanionsTabContent.tsx",
);

describe("FR-npc-player-link — companions without full-sheet edit mode", () => {
  it("nominal: liaison actions do not require isEditing on the companions tab", () => {
    const tab = readFileSync(tabPath, "utf8");
    expect(tab).toContain("showLiaisonActions = canManageLiaisons");
    expect(tab).not.toMatch(/showLiaisonActions\s*=\s*isEditing\s*&&/);
  });

  it("nominal: companions tab persists liaisons immediately like the sidebar", () => {
    const tab = readFileSync(tabPath, "utf8");
    expect(tab).toContain("persistSidebarNpcLinkedPlayer");
    expect(tab).toContain("persistNpcLink");
    expect(tab).not.toContain("pendingOps");
    expect(tab).not.toContain("persistRef");
  });

  it("edge: character detail view has no companion-only save footer", () => {
    const detail = readFileSync(detailPath, "utf8");
    expect(detail).not.toContain("hasPendingCompanionChanges");
    expect(detail).not.toContain("handleCompanionOnlySave");
  });
});
