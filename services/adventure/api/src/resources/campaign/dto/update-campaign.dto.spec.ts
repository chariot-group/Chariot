import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateCampaignDto } from '@/resources/campaign/dto/update-campaign.dto';
import { UpdatePlayerDto } from '@/resources/character/player/dto/update-player.dto';
import { UpdateNpcDto } from '@/resources/character/npc/dto/update-npc.dto';

describe('Update DTOs - FR-game-system: immutable gameSystem', () => {
  it('should not accept gameSystem on UpdateCampaignDto', () => {
    const dto = plainToInstance(UpdateCampaignDto, {
      label: 'Renamed',
      gameSystem: 'DND_5E',
    });

    const errors = validateSync(dto, { whitelist: true });
    expect(errors).toHaveLength(0);
    expect(dto).not.toHaveProperty('gameSystem');
  });

  it('should not accept gameSystem on UpdatePlayerDto', () => {
    const dto = plainToInstance(UpdatePlayerDto, {
      firstname: 'Aragorn',
      gameSystem: 'DND_5E',
    });

    const errors = validateSync(dto, { whitelist: true });
    expect(errors).toHaveLength(0);
    expect(dto).not.toHaveProperty('gameSystem');
  });

  it('should not accept gameSystem on UpdateNpcDto', () => {
    const dto = plainToInstance(UpdateNpcDto, {
      firstname: 'Goblin',
      gameSystem: 'DND_5E',
    });

    const errors = validateSync(dto, { whitelist: true });
    expect(errors).toHaveLength(0);
    expect(dto).not.toHaveProperty('gameSystem');
  });

  it('FR-game-system: update DTOs of Campaign and Player strip rulesetId', () => {
    const rulesetId = '507f1f77bcf86cd799439011';
    const campaign = plainToInstance(UpdateCampaignDto, { rulesetId });
    const player = plainToInstance(UpdatePlayerDto, { rulesetId });

    expect(validateSync(campaign, { whitelist: true })).toHaveLength(0);
    expect(validateSync(player, { whitelist: true })).toHaveLength(0);
    expect(campaign).not.toHaveProperty('rulesetId');
    expect(player).not.toHaveProperty('rulesetId');
  });
});
