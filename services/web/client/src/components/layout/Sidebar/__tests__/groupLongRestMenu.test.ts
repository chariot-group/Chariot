import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = fileURLToPath(new URL("..", import.meta.url));
const groupList = readFileSync(resolve(dir, "GroupList.tsx"), "utf8");
const abilities = readFileSync(
    resolve(dir, "../../character/tabContents/shared/AbilitiesUpdateSection.tsx"),
    "utf8",
);

/** @see FR-character-long-rest, FR-sidebar-context-actions */
describe("FR-character-long-rest — sidebar group menu and counter flags", () => {
    it("nominal: active groups expose the group long rest with a non-destructive confirmation", () => {
        expect(groupList).toContain('id: "longRest"');
        expect(groupList).toContain("items.push(longRestAction)");
        expect(groupList).toContain("destructive={false}");
        expect(groupList).toContain("onConfirm={handleConfirmGroupLongRest}");
    });

    it("edge: in session only the long rest stays enabled; archived groups keep no menu; empty group disables it", () => {
        const sessionBranch = groupList.slice(groupList.indexOf("if (actionsDisabled) {\n        if (isArchivedSection) return [];"));
        expect(sessionBranch).toContain("longRestAction,");
        expect(sessionBranch.slice(0, 600).match(/disabled: true/g)?.length).toBe(4);
        expect(groupList).toContain("disabled: !hasCharacters");
    });

    it("failure: the dialog cannot be dismissed while the rest is running; out of session sheets are refreshed locally", () => {
        expect(groupList).toContain("if (!open && !isRestingGroup) setGroupPendingLongRest(null);");
        expect(groupList).toContain("if (!isSessionLaunched) {\n        for (const character of rested) dispatch(touchRemoteCharacterSheet(character._id));");
    });

    it("nominal: checking the short rest flag also checks the long rest flag, never the reverse", () => {
        expect(abilities).toMatch(/if \(c === true\) \{\s*form\.setValue\(`\$\{fieldArrayName\}\.\$\{index\}\.counterResetsOnLongRest`, true/);
        const longController = abilities.slice(abilities.indexOf("counterResetsOnLongRest`}\n"));
        expect(longController.slice(0, 900)).not.toContain("counterResetsOnShortRest");
    });
});
