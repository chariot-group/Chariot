import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import en from "@/../messages/en.json";
import es from "@/../messages/es.json";
import fr from "@/../messages/fr.json";
import * as attackUtils from "@/utils/attack.utils";

const actionUpdateSectionPath = resolve(
  fileURLToPath(new URL("..", import.meta.url)),
  "ActionUpdateSection.tsx",
);
const attackUtilsPath = resolve(fileURLToPath(new URL("../../../../../../utils/attack.utils.ts", import.meta.url)));

/** @see FR-character-detail-view: Character Detail View Display */
describe("FR-character-detail-view — combat action ability suggestion labels", () => {
  it("nominal: ActionUpdateSection renders ability abbreviations via i18n", () => {
    const source = readFileSync(actionUpdateSectionPath, "utf8");

    expect(source).toContain('useTranslations("characterDetail.player.general.abilitiesAbbr")');
    expect(source).toContain("tAbilitiesAbbr(suggestion.key)");
    expect(source).not.toContain("ABILITY_SCORE_SHORT_LABELS");
  });

  it("edge: en/fr/es expose distinct strength and wisdom abbreviations", () => {
    expect(en.characterDetail.player.general.abilitiesAbbr.strength).toBe("STR");
    expect(en.characterDetail.player.general.abilitiesAbbr.wisdom).toBe("WIS");
    expect(fr.characterDetail.player.general.abilitiesAbbr.strength).toBe("FOR");
    expect(fr.characterDetail.player.general.abilitiesAbbr.wisdom).toBe("SAG");
    expect(es.characterDetail.player.general.abilitiesAbbr.strength).toBe("FUE");
    expect(es.characterDetail.player.general.abilitiesAbbr.wisdom).toBe("SAB");
  });

  it("error: attack.utils no longer hardcodes French ability short labels", () => {
    expect(attackUtils).not.toHaveProperty("ABILITY_SCORE_SHORT_LABELS");

    const source = readFileSync(attackUtilsPath, "utf8");
    expect(source).not.toContain('strength: "FOR"');
    expect(source).not.toContain('wisdom: "SAG"');
  });
});
