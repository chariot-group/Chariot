import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SpellDto } from '@/resources/character/core/dto/spellcasting/sub/spell.dto';

describe('FR-character-spell-multi-damage — SpellDto', () => {
  it('nominal: validates several typed damage entries', () => {
    const dto = plainToInstance(SpellDto, {
      name: 'Ice Knife',
      damageDetails: [
        { diceCount: 1, diceType: 'd10', bonus: 0, damageType: 'piercing' },
        { diceCount: 2, diceType: 'd6', bonus: 0, damageType: 'cold' },
      ],
    });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.damageDetails).toHaveLength(2);
  });

  it('edge: wraps a legacy single damageDetails object into a list', () => {
    const dto = plainToInstance(SpellDto, {
      name: 'Fireball',
      damageDetails: {
        diceCount: 8,
        diceType: 'd6',
        bonus: 0,
        damageType: 'fire',
      },
    });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.damageDetails).toEqual([
      { diceCount: 8, diceType: 'd6', bonus: 0, damageType: 'fire' },
    ]);
  });

  it('failure: rejects invalid nested damageDetails types', () => {
    const dto = plainToInstance(SpellDto, {
      name: 'Fireball',
      damageDetails: [{ diceCount: 'nope', diceType: 'd6' }],
    });

    expect(validateSync(dto).length).toBeGreaterThan(0);
  });
});
