import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards FR-web-first-load-performance: a static import of these modules from the layout or
 * from a sheet tab would pull them back into the initial JS of every route.
 */
const SRC = path.resolve(__dirname, "../../..");

const ON_DEMAND_MODULES = [
  "@/components/dialogs/SessionCommunityLibraryDialog",
  "@/components/dialogs/ExportCharacterSheetPdfDialog",
  "@/components/dialogs/ReleaseNotesModal",
  "@/components/dialogs/DuplicateCharacterDialog",
  "@/components/dialogs/JoinSessionDialog",
  "@/components/layout/Sidebar/shared/DeletePlayerWithCompanionsDialog",
  "@/components/character/tabContents/magic/CodexSpellSearchDialog",
  "@/components/character/tabContents/general/form/PlayerGeneralTabEdit",
  "@/components/character/tabContents/general/form/NpcGeneralTabEdit",
  "@/components/character/tabContents/battle/form/PlayerBattleTabEdit",
  "@/components/character/tabContents/battle/form/NPCBattleTabEdit",
  "@/components/character/tabContents/magic/form/CharacterMagicTabEdit",
  "@/components/character/tabContents/inventory/form/CharacterInventoryTabEdit",
  "@/components/character/tabContents/history/form/CharacterHistoryTabEdit",
];

const IMPORTERS = [
  "components/layout/SessionCommunityLibraryButton.tsx",
  "components/layout/Sidebar/ActionButton.tsx",
  "components/layout/Sidebar/GroupList.tsx",
  "components/layout/Sidebar/CharactersWithoutGroupList.tsx",
  "components/ReleaseNotesProvider.tsx",
  "components/SessionJoinParamListener.tsx",
  "components/character/CharacterDetailView.tsx",
  "components/character/tabContents/CharacterInventoryTabContent.tsx",
  "components/character/tabContents/battle/CharacterBattleTabContent.tsx",
  "components/character/tabContents/battle/CharacterNpcBattleTabContent.tsx",
  "components/character/tabContents/battle/CharacterPlayerBattleTabContent.tsx",
  "components/character/tabContents/general/CharacterGeneralTabContent.tsx",
  "components/character/tabContents/general/CharacterNpcGeneralTabContent.tsx",
  "components/character/tabContents/history/CharacterHistoryTabContent.tsx",
  "components/character/tabContents/inventory/CharacterInventoryTabContent.tsx",
  "components/character/tabContents/magic/CharacterMagicTabContent.tsx",
  "components/character/tabContents/magic/form/CharacterMagicTabEdit.tsx",
];

function staticImports(source: string): string[] {
  return [...source.matchAll(/^import\s+(?!type\b)[^;]*?from\s+"([^"]+)";/gm)].map((match) => match[1]);
}

describe("initial bundle imports (FR-web-first-load-performance)", () => {
  it.each(IMPORTERS)("%s does not statically import an on-demand module", (file) => {
    const imports = staticImports(readFileSync(path.join(SRC, file), "utf8"));
    expect(imports.filter((specifier) => ON_DEMAND_MODULES.includes(specifier))).toEqual([]);
  });

  it("release notes provider reads the version without the release notes data", () => {
    const imports = staticImports(readFileSync(path.join(SRC, "components/ReleaseNotesProvider.tsx"), "utf8"));
    expect(imports).not.toContain("@/data/release-notes");
    expect(imports).toContain("@/data/release-notes/currentVersion");
  });

  it("failure guard: the import scanner detects a static import", () => {
    expect(staticImports('import { X } from "@/components/dialogs/JoinSessionDialog";')).toEqual([
      "@/components/dialogs/JoinSessionDialog",
    ]);
    expect(staticImports('import type { X } from "@/components/dialogs/JoinSessionDialog";')).toEqual([]);
  });
});
