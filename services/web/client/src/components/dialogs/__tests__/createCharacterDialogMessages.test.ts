import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import en from "@/../messages/en.json";
import es from "@/../messages/es.json";
import fr from "@/../messages/fr.json";

/**
 * Every `t("…")` key of the create-character dialog exists in its `sidebar` namespace, in every locale
 * (a missing key breaks the sidebar with MISSING_MESSAGE).
 * @see FR-player-space-codex-character-creation, FR-ruleset-character-builder — Web builder UI (Entry point)
 */

const source = fs.readFileSync(path.resolve(__dirname, "../CreateCharacterDialog.tsx"), "utf8");
const usedKeys = [...source.matchAll(/\bt\("([A-Za-z0-9_.]+)"\)/g)].map((match) => match[1]);
const locales = { fr, en, es } as Record<string, { sidebar: Record<string, unknown> }>;

describe("CreateCharacterDialog messages", () => {
  it("nominal: the builder choice keys are in the sidebar namespace (no description line)", () => {
    expect(usedKeys).not.toContain("createCharacterBuilderDescription");
    expect(usedKeys).toEqual(expect.arrayContaining(["createCharacterBuilder", "createCharacterBuilderAriaLabel"]));
  });

  it.each(Object.keys(locales))("edge: every key used by the dialog exists in %s", (locale) => {
    const missing = usedKeys.filter((key) => typeof locales[locale].sidebar[key] !== "string");

    expect(missing).toEqual([]);
  });

  it("failure guard: the builder keys are not left in another namespace", () => {
    for (const messages of Object.values(locales) as Record<string, Record<string, unknown>>[]) {
      expect(messages.characterCreate).not.toHaveProperty("createCharacterBuilder");
    }
  });
});
