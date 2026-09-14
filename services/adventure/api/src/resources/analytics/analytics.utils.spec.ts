import {
  median,
  spentGiftNeverBoughtFilter,
  unusedGiftUsersFilter,
} from '@/resources/analytics/analytics.utils';

describe('analytics.utils median', () => {
  it('nominal: returns the middle value', () => {
    expect(median([1, 3, 2])).toBe(2);
  });

  it('edge: returns null for an empty list', () => {
    expect(median([])).toBeNull();
  });
});

describe('FR-admin-business-kpis shop conversion filters', () => {
  it('nominal: spent-gift-never-bought is balance 0 without a shop credit', () => {
    expect(spentGiftNeverBoughtFilter('Shop')).toMatchObject({
      balance: 0,
      history: {
        $not: {
          $elemMatch: { campaignName: 'Shop', value: { $lt: 0 } },
        },
      },
    });
  });

  it('edge: unused gift is exclusive — balance 1 with no expense', () => {
    expect(unusedGiftUsersFilter()).toEqual({
      balance: 1,
      history: { $not: { $elemMatch: { value: { $gt: 0 } } } },
    });
    expect(unusedGiftUsersFilter().balance).not.toBe(
      spentGiftNeverBoughtFilter('Shop').balance,
    );
  });
});
