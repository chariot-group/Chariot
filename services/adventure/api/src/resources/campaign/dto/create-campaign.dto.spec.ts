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

  it('FR-game-system: accepts a Mongo id as rulesetId and rejects any other value', () => {
    const valid = plainToInstance(CreateCampaignDto, {
      ...basePayload,
      rulesetId: '507f1f77bcf86cd799439011',
    });
    const invalid = plainToInstance(CreateCampaignDto, {
      ...basePayload,
      rulesetId: 'dnd5e-2014',
    });

    expect(validateSync(valid, { whitelist: true })).toHaveLength(0);
    expect(valid.rulesetId).toBe('507f1f77bcf86cd799439011');
    expect(validateSync(invalid, { whitelist: true }).length).toBeGreaterThan(
      0,
    );
  });
});
