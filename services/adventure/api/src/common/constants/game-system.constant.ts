export const GAME_SYSTEMS = ['DND_5E'] as const;

export type GameSystem = (typeof GAME_SYSTEMS)[number];

export const DEFAULT_GAME_SYSTEM: GameSystem = 'DND_5E';
