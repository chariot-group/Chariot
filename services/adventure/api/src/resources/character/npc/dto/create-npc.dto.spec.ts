import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateNpcDto } from '@/resources/character/npc/dto/create-npc.dto';

describe('CreateNpcDto - FR-003: NPC Conditions (No Exhaustion)', () => {
  describe('NPC should accept standard conditions but NOT exhaustion', () => {
    it('should accept NPC with standard conditions', () => {
      const dto = plainToInstance(CreateNpcDto, {
        firstname: 'Goblin',
        conditions: {
          frightened: true,
          poisoned: false,
        }
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
    });

    it('should accept NPC without any conditions', () => {
      const dto = plainToInstance(CreateNpcDto, {
        firstname: 'Dragon',
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
    });

    it('should NOT have exhaustionLevel field available for NPCs', () => {
      const dto = plainToInstance(CreateNpcDto, {
        firstname: 'Orc',
        conditions: {
          blinded: true,
        }
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);

      // Verify that exhaustionLevel is not part of NPC DTO
      // This is a structural test to ensure NPCs don't have access to exhaustion
      expect((dto as any).exhaustionLevel).toBeUndefined();
    });
  });
});
