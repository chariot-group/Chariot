/** @see FR-character-spell-multi-damage */
import { wrapSpellDamageDetails } from '@/resources/character/core/utils/spell-damage-details.util';

describe('wrapSpellDamageDetails', () => {
  it('nominal: keeps an existing damage list', () => {
    const entries = [
      { diceCount: 8, diceType: 'd6', bonus: 0, damageType: 'fire' },
      { diceCount: 1, diceType: 'd8', bonus: 0, damageType: 'radiant' },
    ];

    expect(wrapSpellDamageDetails(entries)).toEqual(entries);
  });

  it('edge: wraps a legacy single damage object into a one-entry list', () => {
    const legacy = { diceCount: 8, diceType: 'd6', bonus: 0, damageType: 'fire' };

    expect(wrapSpellDamageDetails(legacy)).toEqual([legacy]);
  });

  it('edge: empty values become an empty list', () => {
    expect(wrapSpellDamageDetails(undefined)).toEqual([]);
    expect(wrapSpellDamageDetails(null)).toEqual([]);
    expect(wrapSpellDamageDetails('')).toEqual([]);
  });
});
