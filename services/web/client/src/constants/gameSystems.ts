export const GAME_SYSTEMS = ["DND_5E"] as const;

export type CodexGameSystem = (typeof GAME_SYSTEMS)[number];

export const DEFAULT_GAME_SYSTEM: CodexGameSystem = "DND_5E";

/** True when the Codex game-system filter should be shown (multiple supported systems). */
export const HAS_MULTIPLE_CODEX_GAME_SYSTEMS = GAME_SYSTEMS.length > 1;

/**
 * Default game-system filter for Codex search dialogs.
 * When only one system exists, it is preselected; otherwise unset (all systems).
 * @see FR-codex-game-system-filter
 */
export function getDefaultCodexGameSystemFilter(): CodexGameSystem | null {
  return HAS_MULTIPLE_CODEX_GAME_SYSTEMS ? null : GAME_SYSTEMS[0];
}

export function gameSystemTranslationKey(gameSystem: CodexGameSystem): string {
  return gameSystem;
}
