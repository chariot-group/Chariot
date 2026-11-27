import type { Player } from "@/types/character";

/** Builder-only markers of a chosen spell (`source` Codex/manual, `codexId`), not part of the sheet. */
const BUILDER_SPELL_KEYS = ["source", "codexId"];

function withoutBuilderSpellKeys(spellcasting: unknown): unknown {
  if (!Array.isArray(spellcasting)) return spellcasting;
  return spellcasting.map((block) => {
    if (typeof block !== "object" || block === null || !Array.isArray((block as { spells?: unknown }).spells)) {
      return block;
    }
    const spells = (block as { spells: unknown[] }).spells.map((spell) =>
      typeof spell === "object" && spell !== null
        ? Object.fromEntries(Object.entries(spell).filter(([key]) => !BUILDER_SPELL_KEYS.includes(key)))
        : spell,
    );
    return { ...block, spells };
  });
}

/**
 * Turns the sheet projected by the engine into a `Player` draft for the creation form.
 * The form, not the builder, saves the character.
 *
 * @see FR-ruleset-character-builder — Web builder UI (End of the builder)
 */
export function buildPlayerDraftFromSheet(
  sheet: Record<string, unknown>,
  groupId?: string | null,
  rulesetId?: string | null,
): Partial<Player> {
  return {
    ...(sheet as Partial<Player>),
    ...(sheet.spellcasting !== undefined
      ? { spellcasting: withoutBuilderSpellKeys(sheet.spellcasting) as Partial<Player>["spellcasting"] }
      : {}),
    // The creation form sends `groups` as ids (CharacterWriteData).
    groups: (groupId ? [groupId] : []) as unknown as Partial<Player>["groups"],
    // The created character keeps the ruleset it was built with (FR-game-system — Ruleset reference).
    ...(rulesetId ? { rulesetId } : {}),
  };
}
