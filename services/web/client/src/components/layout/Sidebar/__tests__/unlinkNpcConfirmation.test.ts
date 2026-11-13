import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import en from "@/../messages/en.json";
import es from "@/../messages/es.json";
import fr from "@/../messages/fr.json";

const read = (file: string) => readFileSync(resolve(process.cwd(), "src/components", file), "utf8");

const sidebar = read("layout/Sidebar/CharactersWithoutGroupList.tsx");
const companionsTab = read("character/tabContents/companions/CharacterCompanionsTabContent.tsx");
const dialog = read("layout/Sidebar/shared/UnlinkNpcConfirmDialog.tsx");

/** @see FR-sidebar-npc-link (Unlink confirmation), FR-npc-player-link */
describe("Unlink NPC confirmation", () => {
  it("nominal: FR dialog names the NPC and the Player with the « Retirer » wording", () => {
    expect(fr.sidebar.unlinkNpcDialogTitle).toBe("Retirer le PNJ");
    expect(fr.sidebar.unlinkNpcDialogDescription).toBe(
      "Voulez-vous retirer {npc} des compagnons de {player} ? Le PNJ restera dans vos personnages.",
    );
    expect(fr.sidebar.unlinkNpcConfirm).toBe("Retirer");
  });

  it.each([
    ["en", en],
    ["es", es],
  ] as const)("nominal: %s dialog texts exist and embed both names", (_, messages) => {
    expect(messages.sidebar.unlinkNpcDialogTitle).toBeTruthy();
    expect(messages.sidebar.unlinkNpcConfirm).toBeTruthy();
    expect(messages.sidebar.unlinkNpcDialogDescription).toContain("{npc}");
    expect(messages.sidebar.unlinkNpcDialogDescription).toContain("{player}");
  });

  it.each([
    ["sidebar menu", sidebar, "onSelect: () => {\n          setNpcPendingUnlink(character as NPC);"],
    ["Companions tab", companionsTab, "onUnlink={setNpcPendingUnlink}"],
  ])("nominal: %s opens the dialog instead of unlinking right away", (_, source, opener) => {
    expect(source).toContain(opener);
    expect(source).toContain("<UnlinkNpcConfirmDialog");
    expect(source).toMatch(
      /onConfirm=\{\(\) => \{\s*if \(!npcPendingUnlink\) return;\s*void persistNpcLink\(npcPendingUnlink, null\);/,
    );
  });

  it("edge: long NPC and Player names are truncated in the description", () => {
    expect(dialog).toContain("npc: truncateForToast(npcName || unnamed)");
    expect(dialog).toContain("player: truncateForToast(playerName || unnamed)");
  });

  it("guard: dialog uses the white primary button, non-destructive, and cannot be dismissed while the request is pending", () => {
    expect(dialog).toContain("destructive={false}");
    expect(dialog).toContain('confirmVariant="primary"');
    expect(dialog).toContain("if (!open && !isLoading) onCancel();");
  });

  it.each([
    ["sidebar", sidebar],
    ["Companions tab", companionsTab],
  ])("failure: %s closes the dialog only after a successful unlink", (_, source) => {
    const close = source.indexOf("setNpcPendingUnlink(null);\n");
    const persistCall = source.indexOf("await persistSidebarNpcLinkedPlayer(");
    const nextCatch = source.indexOf("} catch", persistCall);

    expect(close).toBeGreaterThan(persistCall);
    expect(close).toBeLessThan(nextCatch);
  });
});
