import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ConditionsDto } from '@/resources/character/core/dto/conditions/conditions.dto';

describe('ConditionsDto - FR-dnd-conditions: D&D Conditions Management', () => {
  describe('Standard conditions validation', () => {
    it('should accept valid boolean conditions', () => {
      const dto = plainToInstance(ConditionsDto, {
        blinded: true,
        charmed: false,
        deafened: true,
        frightened: false,
        grappled: true,
        incapacitated: false,
        invisible: true,
        paralyzed: false,
        petrified: true,
        poisoned: false,
        prone: true,
        restrained: false,
        stunned: true,
        unconscious: false,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
    });

    it('should reject non-boolean values for standard conditions', () => {
      const dto = plainToInstance(ConditionsDto, {
        blinded: 'yes', // invalid type
        charmed: 1, // invalid type
        frightened: [], // invalid type
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors.length).toBeGreaterThan(0);

      const blindedError = errors.find((e) => e.property === 'blinded');
      const charmedError = errors.find((e) => e.property === 'charmed');
      const frightenedError = errors.find((e) => e.property === 'frightened');

      expect(blindedError).toBeDefined();
      expect(charmedError).toBeDefined();
      expect(frightenedError).toBeDefined();
    });

    it('should accept empty conditions object (all optional)', () => {
      const dto = plainToInstance(ConditionsDto, {});

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
    });
  });

  describe('Combined conditions validation', () => {
    it('should accept multiple conditions', () => {
      const dto = plainToInstance(ConditionsDto, {
        paralyzed: true,
        unconscious: true,
        prone: true,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
    });

    it('should accept all conditions set to false', () => {
      const dto = plainToInstance(ConditionsDto, {
        blinded: false,
        charmed: false,
        deafened: false,
        frightened: false,
        grappled: false,
        incapacitated: false,
        invisible: false,
        paralyzed: false,
        petrified: false,
        poisoned: false,
        prone: false,
        restrained: false,
        stunned: false,
        unconscious: false,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
    });
  });
});
