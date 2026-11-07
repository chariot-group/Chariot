import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { deriveMasteryToggles } from "@/components/character/tabContents/general/form/SkillsEdit";

const sensesPath = resolve(
  fileURLToPath(new URL("../../shared/", import.meta.url)),
  "SensesUpdateSection.tsx",
);
const abilitiesPath = resolve(
  fileURLToPath(new URL("../../../shared/", import.meta.url)),
  "AbilitiesUpdateSection.tsx",
);

/** @see FR-character-general-bento-layout, FR-character-list-card */
describe("deriveMasteryToggles", () => {
  it("nominal: half-proficiency and expertise levels enable their toggles", () => {
    expect(deriveMasteryToggles({ athletics: 1, stealth: 3 })).toEqual({ halfProficiency: true, expertise: true });
  });

  it("edge: proficient-only (level 2) or empty masteries enable nothing", () => {
    expect(deriveMasteryToggles({ athletics: 2, arcana: 0 })).toEqual({ halfProficiency: false, expertise: false });
    expect(deriveMasteryToggles({})).toEqual({ halfProficiency: false, expertise: false });
  });

  it("failure: missing masteries do not throw", () => {
    expect(deriveMasteryToggles(undefined)).toEqual({ halfProficiency: false, expertise: false });
    expect(deriveMasteryToggles(null)).toEqual({ halfProficiency: false, expertise: false });
  });
});

const playerEditPath = resolve(fileURLToPath(new URL("../", import.meta.url)), "PlayerGeneralTabEdit.tsx");

describe("senses edit list and rest checkboxes", () => {
  it("edge: senses are the last block of the player proficiencies card", () => {
    const src = readFileSync(playerEditPath, "utf8");
    expect(src.indexOf("<SensesUpdateSection")).toBeGreaterThan(src.indexOf('name="stats.armors"'));
  });

  it("nominal: the senses list is not a clipped scroll area", () => {
    const src = readFileSync(sensesPath, "utf8");
    expect(src).not.toContain("overflow-y-auto");
    expect(src).not.toContain("max-h-44");
  });

  it("edge: senses span the full proficiencies grid and lay their rows in columns", () => {
    expect(readFileSync(playerEditPath, "utf8")).toContain("@lg:col-span-full @4xl:col-span-2");
    expect(readFileSync(sensesPath, "utf8")).toContain("@lg:grid-cols-2");
  });

  it("edge: the add button sits in the header row, above the list", () => {
    const src = readFileSync(sensesPath, "utf8");
    expect(src.indexOf("handleAddSense}")).toBeLessThan(src.indexOf("senseFields.length > 0"));
  });

  it("edge: adding a sense scrolls to and focuses its name field", () => {
    const src = readFileSync(sensesPath, "utf8");
    expect(src).toContain("document.getElementById(`sense-name-${newIndex}`)");
    expect(src).toContain("input?.focus()");
  });

  it("guard: rest tiles center their content instead of top-aligning it", () => {
    const src = readFileSync(abilitiesPath, "utf8");
    expect(src).not.toContain("min-h-10 items-start");
    expect(src).toContain("min-h-10 items-center");
  });
});
