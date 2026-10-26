import { describe, expect, it } from "vitest";
import { ROUND_DURATION_SECONDS, tickConditionEntries } from "@/components/initiativeTracker/conditionDuration";
import {
  CUSTOM_EFFECT_NAME_MAX_LENGTH,
  buildCustomEffectEntry,
  findCatalogEntryByName,
  normalizeCustomEffectCatalog,
  normalizeCustomEffectEntries,
  replaceCustomEffectOnRow,
  upsertCustomEffectDefinition,
} from "@/components/initiativeTracker/customEffects";

describe("FR-tracker-custom-effects — catalog", () => {
  it("nominal: creates a definition and reuses it by case-insensitive name", () => {
    const created = upsertCustomEffectDefinition([], { id: "fx-1", name: "  Béni  ", description: "Avantage aux jets" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(created.definition).toEqual({
      id: "fx-1",
      name: "Béni",
      description: "Avantage aux jets",
    });

    const reused = upsertCustomEffectDefinition(created.catalog, { name: "béni", description: "ignored" });
    expect(reused.ok).toBe(true);
    if (!reused.ok) return;
    expect(reused.definition.id).toBe("fx-1");
    expect(reused.catalog).toHaveLength(1);
    expect(findCatalogEntryByName(reused.catalog, "BÉNI")?.id).toBe("fx-1");
  });

  it("edge: fills an empty description when reusing an existing name", () => {
    const created = upsertCustomEffectDefinition([], { id: "fx-2", name: "Hex" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const reused = upsertCustomEffectDefinition(created.catalog, { name: "Hex", description: "Malus" });
    expect(reused.ok).toBe(true);
    if (!reused.ok) return;
    expect(reused.definition.description).toBe("Malus");
  });

  it("failure: rejects an empty name", () => {
    const result = upsertCustomEffectDefinition([], { name: "   " });
    expect(result).toEqual({ ok: false, error: "empty-name" });
  });

  it("edge: drops duplicate catalog ids/names and truncates long names", () => {
    const catalog = normalizeCustomEffectCatalog([
      { id: "a", name: "Burning" },
      { id: "a", name: "Other" },
      { id: "b", name: "burning" },
      { id: "c", name: "x".repeat(CUSTOM_EFFECT_NAME_MAX_LENGTH + 8) },
      { id: "", name: "Nope" },
    ]);

    expect(catalog).toHaveLength(2);
    expect(catalog[0]).toEqual({ id: "a", name: "Burning" });
    expect(catalog[1]?.name).toHaveLength(CUSTOM_EFFECT_NAME_MAX_LENGTH);
  });
});

describe("FR-tracker-custom-effects — row instances", () => {
  it("nominal: replacing the same effect keeps a single instance", () => {
    const first = buildCustomEffectEntry({ id: "fx-1", name: "Béni" }, { amount: 2, unit: "rounds" });
    const next = replaceCustomEffectOnRow([first], { id: "fx-1", name: "Béni" }, { amount: 1, unit: "minutes" });
    expect(next).toHaveLength(1);
    expect(next[0]?.duration).toEqual({ amount: 1, unit: "minutes" });
  });

  it("edge: duration ticks and expired instances are removed", () => {
    const entry = buildCustomEffectEntry({ id: "fx-1", name: "Hex" }, { amount: 1, unit: "rounds" });
    expect(entry.remainingSeconds).toBe(ROUND_DURATION_SECONDS);
    const ticked = tickConditionEntries([entry], -ROUND_DURATION_SECONDS);
    expect(ticked).toEqual([]);
  });

  it("failure: invalid entries are dropped on normalize", () => {
    expect(
      normalizeCustomEffectEntries([
        { effectId: "ok", name: "Bless" },
        { effectId: "", name: "Nope" },
        { name: "Missing id" },
        null,
      ]),
    ).toEqual([{ effectId: "ok", name: "Bless" }]);
  });
});
