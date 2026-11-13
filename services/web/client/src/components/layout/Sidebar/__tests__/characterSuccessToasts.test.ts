import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import en from "@/../messages/en.json";
import es from "@/../messages/es.json";
import fr from "@/../messages/fr.json";

const read = (file: string) => readFileSync(resolve(process.cwd(), "src/components", file), "utf8");

const unlinkCallers = [
  "layout/Sidebar/CharactersWithoutGroupList.tsx",
  "character/tabContents/companions/CharacterCompanionsTabContent.tsx",
] as const;

const deleteCallers = ["layout/Sidebar/CharactersWithoutGroupList.tsx", "layout/Sidebar/GroupList.tsx"] as const;

/** @see FR-sidebar-npc-link, FR-player-companion-choice */
describe("Character success toasts — embedded names", () => {
  it("nominal: FR messages name the character", () => {
    expect(fr.sidebar.unlinkNpcSuccess).toBe("{name} retiré avec succès.");
    expect(fr.sidebar.deletePlayerSuccess).toBe("{name} supprimé avec succès.");
  });

  it.each([
    ["en", en],
    ["es", es],
  ] as const)("nominal: %s messages embed {name}", (_, messages) => {
    expect(messages.sidebar.unlinkNpcSuccess).toContain("{name}");
    expect(messages.sidebar.deletePlayerSuccess).toContain("{name}");
  });

  it.each(unlinkCallers)("edge: %s truncates the NPC name in the unlink toast", (file) => {
    const call = read(file).match(/\("unlinkNpcSuccess",\s*\{\s*name:\s*([^}]+)\}/)?.[1] ?? "";
    expect(call).toContain("truncateForToast(characterDisplayName(npc)");
  });

  it.each(deleteCallers)("edge: %s truncates the Player name in the delete toast", (file) => {
    const call = read(file).match(/t\(\s*"deletePlayerSuccess",\s*\{\s*name:\s*([^}]+)\}/)?.[1] ?? "";
    expect(call).toContain("truncateForToast(characterDisplayName(");
  });

  it.each(deleteCallers)("failure: %s shows the delete toast only after the Player delete succeeded", (file) => {
    const source = read(file);
    const deleteCall = source.indexOf("await deletePlayerCharacterWithCompanionChoice(");
    const toast = source.indexOf('"deletePlayerSuccess"');
    const nextCatch = source.indexOf("} catch", deleteCall);

    expect(deleteCall).toBeGreaterThan(-1);
    expect(toast).toBeGreaterThan(deleteCall);
    expect(toast).toBeLessThan(nextCatch);
  });
});
