import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreatePlayerDto } from '@/resources/character/player/dto/create-player.dto';

describe('CreatePlayerDto - FR-dnd-conditions: Player Exhaustion Management', () => {
  describe('Exhaustion level validation - Player specific', () => {
    it('should accept valid exhaustion level 0 (no exhaustion)', () => {
      const dto = plainToInstance(CreatePlayerDto, {
        firstname: 'Test Hero',
        exhaustionLevel: 0,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
    });

    it('should accept valid exhaustion level 1 (disadvantage on ability checks)', () => {
      const dto = plainToInstance(CreatePlayerDto, {
        firstname: 'Tired Hero',
        exhaustionLevel: 1,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
    });

    it('should accept valid exhaustion level 2 (speed halved)', () => {
      const dto = plainToInstance(CreatePlayerDto, {
        firstname: 'Weary Hero',
        exhaustionLevel: 2,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
    });

    it('should accept valid exhaustion level 3 (disadvantage on attacks and saves)', () => {
      const dto = plainToInstance(CreatePlayerDto, {
        firstname: 'Exhausted Hero',
        exhaustionLevel: 3,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
    });

    it('should accept valid exhaustion level 4 (hit point maximum halved)', () => {
      const dto = plainToInstance(CreatePlayerDto, {
        firstname: 'Severely Exhausted Hero',
        exhaustionLevel: 4,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
    });

    it('should accept valid exhaustion level 5 (speed reduced to 0)', () => {
      const dto = plainToInstance(CreatePlayerDto, {
        firstname: 'Barely Moving Hero',
        exhaustionLevel: 5,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
    });

    it('should accept valid exhaustion level 6 (death)', () => {
      const dto = plainToInstance(CreatePlayerDto, {
        firstname: 'Dying Hero',
        exhaustionLevel: 6,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
    });

    it('should reject exhaustion level below 0', () => {
      const dto = plainToInstance(CreatePlayerDto, {
        firstname: 'Invalid Hero',
        exhaustionLevel: -1,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors.length).toBeGreaterThan(0);

      const exhaustionError = errors.find(
        (e) => e.property === 'exhaustionLevel',
      );
      expect(exhaustionError).toBeDefined();
      expect(exhaustionError?.constraints).toHaveProperty('min');
    });

    it('should reject exhaustion level above 6', () => {
      const dto = plainToInstance(CreatePlayerDto, {
        firstname: 'Invalid Hero',
        exhaustionLevel: 7,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors.length).toBeGreaterThan(0);

      const exhaustionError = errors.find(
        (e) => e.property === 'exhaustionLevel',
      );
      expect(exhaustionError).toBeDefined();
      expect(exhaustionError?.constraints).toHaveProperty('max');
    });

    it('should reject non-integer exhaustion level', () => {
      const dto = plainToInstance(CreatePlayerDto, {
        firstname: 'Invalid Hero',
        exhaustionLevel: 2.5,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors.length).toBeGreaterThan(0);

      const exhaustionError = errors.find(
        (e) => e.property === 'exhaustionLevel',
      );
      expect(exhaustionError).toBeDefined();
      expect(exhaustionError?.constraints).toHaveProperty('isInt');
    });

    it('should reject string exhaustion level', () => {
      const dto = plainToInstance(CreatePlayerDto, {
        firstname: 'Invalid Hero',
        exhaustionLevel: 'three' as any,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors.length).toBeGreaterThan(0);

      const exhaustionError = errors.find(
        (e) => e.property === 'exhaustionLevel',
      );
      expect(exhaustionError).toBeDefined();
    });
  });

  describe('Player with conditions and exhaustion', () => {
    it('should accept player with both conditions and exhaustion level', () => {
      const dto = plainToInstance(CreatePlayerDto, {
        firstname: 'Afflicted Hero',
        conditions: {
          poisoned: true,
          frightened: false,
        },
        exhaustionLevel: 2,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
    });

    it('should accept player without exhaustion (optional field)', () => {
      const dto = plainToInstance(CreatePlayerDto, {
        firstname: 'Fresh Hero',
        conditions: {
          blinded: false,
        },
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
    });
  });
});
