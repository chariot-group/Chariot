import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

const { normalizeSpellSlots } = await import("@/hooks/useCharacterForm");

const srcDir = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const hookSource = readFileSync(resolve(srcDir, "hooks/useCharacterForm.ts"), "utf8");
const viewSource = readFileSync(resolve(srcDir, "components/character/CharacterDetailView.tsx"), "utf8");

function onUpdateBody(): string {
  const start = hookSource.indexOf("const onUpdate = async");
  const end = hookSource.indexOf("const onCancel = ");
  return hookSource.slice(start, end);
}

describe("useCharacterForm save lifecycle — FR-character-detail-view (Edit / Save Lifecycle)", () => {
  it("nominal: re-baselines the form on the saved character after a successful update", () => {
    const body = onUpdateBody();
    const updateIdx = body.indexOf("CharacterService.updateCharacter(");
    const resetIdx = body.indexOf("form.reset(normalizeSpellSlots(updatedCharacter)");
    const closeIdx = body.indexOf("setIsEditing(false)");

    expect(updateIdx).toBeGreaterThan(-1);
    expect(resetIdx).toBeGreaterThan(updateIdx);
    expect(resetIdx).toBeLessThan(closeIdx);
  });

  it("failure: a failed update does not reset the form (user values kept)", () => {
    const body = onUpdateBody();
    const catchBlock = body.slice(body.indexOf("} catch (err)"));

    expect(catchBlock).not.toContain("form.reset(");
    expect(catchBlock).not.toContain("setIsEditing(false)");
  });

  it("edge: Edit and Save controls are distinct elements (no shared DOM node)", () => {
    expect(viewSource).toContain('<React.Fragment key="edit-actions">');
    expect(viewSource).toContain('<React.Fragment key="view-actions">');
  });
});

describe("normalizeSpellSlots", () => {
  it("nominal: prefixes numeric spellSlotsByUses keys", () => {
    const out = normalizeSpellSlots({
      spellcasting: [{ spellSlotsByUses: { "1": { total: 2 }, daily: { total: 1 } } }],
    }) as { spellcasting: { spellSlotsByUses: Record<string, unknown> }[] };

    expect(Object.keys(out.spellcasting[0].spellSlotsByUses)).toEqual(["k1", "daily"]);
  });

  it("edge: returns data unchanged without spellcasting", () => {
    const data = { firstname: "Aria" };
    expect(normalizeSpellSlots(data)).toBe(data);
    expect(normalizeSpellSlots(null)).toBeNull();
  });
});
