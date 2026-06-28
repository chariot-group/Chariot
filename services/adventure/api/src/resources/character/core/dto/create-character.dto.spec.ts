import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateCharacterDto } from '@/resources/character/core/dto/create-character.dto';

describe('CreateCharacterDto - shared fields validation', () => {
  it('should validate a character with appearance, background, and treasure', () => {
    const dto = plainToInstance(CreateCharacterDto, {
      firstname: 'Aragorn',
      appearance: {
        age: 87,
        height: 190,
        weight: 85,
        eyes: 'Grey',
        skin: 'Light',
        hair: 'Dark',
        description: 'Tall, rugged ranger.',
      },
      background: {
        personalityTraits: 'Stoic and noble',
        ideals: 'Protect the Free Peoples',
        bonds: 'Gondor and the Fellowship',
        flaws: 'Burdened by destiny',
        alliesAndOrgs: 'The Dúnedain',
        backstory: 'Heir of Isildur and a ranger of the North.',
      },
      treasure: {
        cp: 10,
        sp: 5,
        ep: 0,
        gp: 150,
        pp: 2,
        notes: 'Travel funds.',
      },
    });

    const errors = validateSync(dto, { whitelist: true });
    expect(errors).toHaveLength(0);
  });

  it('should invalidate incorrect types in nested DTOs', () => {
    const dto = plainToInstance(CreateCharacterDto, {
      firstname: 'Legolas',
      appearance: {
        age: 'young', // invalid type
      },
      treasure: {
        gp: 'a lot', // invalid type
      },
    });

    const errors = validateSync(dto, { whitelist: true });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate a character with conditions - FR-dnd-conditions', () => {
    const dto = plainToInstance(CreateCharacterDto, {
      firstname: 'Frodo',
      conditions: {
        poisoned: true,
        frightened: false,
      },
    });

    const errors = validateSync(dto, { whitelist: true });
    expect(errors).toHaveLength(0);
  });

  it('should reject non-boolean condition values - FR-dnd-conditions', () => {
    const dto = plainToInstance(CreateCharacterDto, {
      firstname: 'Merry',
      conditions: {
        blinded: 'yes', // invalid: must be boolean
        charmed: 1, // invalid: must be boolean
      },
    });

    const errors = validateSync(dto, { whitelist: true });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate a character without gameSystem - FR-game-system', () => {
    const dto = plainToInstance(CreateCharacterDto, {
      firstname: 'Gimli',
    });

    const errors = validateSync(dto, { whitelist: true });
    expect(errors).toHaveLength(0);
    expect(dto.gameSystem).toBeUndefined();
  });

  it('should accept explicit DND_5E gameSystem - FR-game-system', () => {
    const dto = plainToInstance(CreateCharacterDto, {
      firstname: 'Gimli',
      gameSystem: 'DND_5E',
    });

    const errors = validateSync(dto, { whitelist: true });
    expect(errors).toHaveLength(0);
    expect(dto.gameSystem).toBe('DND_5E');
  });

  it('should reject invalid gameSystem values - FR-game-system', () => {
    const dto = plainToInstance(CreateCharacterDto, {
      firstname: 'Gimli',
      gameSystem: 'PATHFINDER_2E',
    });

    const errors = validateSync(dto, { whitelist: true });
    expect(errors.length).toBeGreaterThan(0);
  });
});
