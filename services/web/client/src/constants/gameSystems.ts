export const GAME_SYSTEMS = ["DND_5E"] as const;

export type CodexGameSystem = (typeof GAME_SYSTEMS)[number];

export const DEFAULT_GAME_SYSTEM: CodexGameSystem = "DND_5E";

export function gameSystemTranslationKey(gameSystem: CodexGameSystem): string {
  return gameSystem;
}
