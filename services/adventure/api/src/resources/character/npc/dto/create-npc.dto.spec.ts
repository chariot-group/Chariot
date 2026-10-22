import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateNpcDto } from '@/resources/character/npc/dto/create-npc.dto';

describe('CreateNpcDto - FR-dnd-conditions: NPC Conditions (No Exhaustion)', () => {
  describe('NPC should accept standard conditions but NOT exhaustion', () => {
    it('should accept NPC with standard conditions', () => {
      const dto = plainToInstance(CreateNpcDto, {
        firstname: 'Goblin',
        conditions: {
          frightened: true,
          poisoned: false,
        },
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
        },
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);

      // Verify that exhaustionLevel is not part of NPC DTO
      // This is a structural test to ensure NPCs don't have access to exhaustion
      expect((dto as any).exhaustionLevel).toBeUndefined();
    });
  });

  describe('FR-npc-player-link', () => {
    it('nominal: accepts a valid linkedPlayerId', () => {
      const dto = plainToInstance(CreateNpcDto, {
        firstname: 'Familiar',
        linkedPlayerId: '507f1f77bcf86cd799439011',
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
      expect(dto.linkedPlayerId).toBe('507f1f77bcf86cd799439011');
    });

    it('edge: accepts null linkedPlayerId to remain unlinked', () => {
      const dto = plainToInstance(CreateNpcDto, {
        firstname: 'Goblin',
        linkedPlayerId: null,
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors).toHaveLength(0);
      expect(dto.linkedPlayerId).toBeNull();
    });

    it('failure: rejects an invalid linkedPlayerId', () => {
      const dto = plainToInstance(CreateNpcDto, {
        firstname: 'Wolf',
        linkedPlayerId: 'not-an-id',
      });

      const errors = validateSync(dto, { whitelist: true });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('linkedPlayerId');
    });
  });
});
