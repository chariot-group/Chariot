import {
  DEFAULT_GAME_SYSTEM,
  GAME_SYSTEMS,
  GameSystem,
} from '@/common/constants/game-system.constant';

describe('game-system.constant - FR-game-system: Game System Attribute', () => {
  it('should expose DND_5E as the only supported game system', () => {
    expect(GAME_SYSTEMS).toEqual(['DND_5E']);
  });

  it('should use DND_5E as the default game system', () => {
    expect(DEFAULT_GAME_SYSTEM).toBe('DND_5E');
    expect(GAME_SYSTEMS).toContain(DEFAULT_GAME_SYSTEM);
  });

  it('should type-check GameSystem as DND_5E', () => {
    const system: GameSystem = 'DND_5E';
    expect(system).toBe('DND_5E');
  });
});
