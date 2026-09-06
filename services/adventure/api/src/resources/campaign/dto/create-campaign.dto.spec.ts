import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateCampaignDto } from '@/resources/campaign/dto/create-campaign.dto';

describe('CreateCampaignDto - FR-game-system: Game System Attribute', () => {
  const basePayload = {
    label: 'Epic Adventure',
    groups: { active: [], archived: [] },
  };

  it('should validate a campaign without gameSystem (defaults to DND_5E at schema level)', () => {
    const dto = plainToInstance(CreateCampaignDto, basePayload);

    const errors = validateSync(dto, { whitelist: true });
    expect(errors).toHaveLength(0);
    expect(dto.gameSystem).toBeUndefined();
  });

  it('should accept explicit DND_5E gameSystem', () => {
    const dto = plainToInstance(CreateCampaignDto, {
      ...basePayload,
      gameSystem: 'DND_5E',
    });

    const errors = validateSync(dto, { whitelist: true });
    expect(errors).toHaveLength(0);
    expect(dto.gameSystem).toBe('DND_5E');
  });

  it('should reject invalid gameSystem values', () => {
    const dto = plainToInstance(CreateCampaignDto, {
      ...basePayload,
      gameSystem: 'PATHFINDER_2E',
    });

    const errors = validateSync(dto, { whitelist: true });
    expect(errors.length).toBeGreaterThan(0);
  });
});
