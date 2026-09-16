jest.mock('@keycloak/keycloak-admin-client', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { InternalServerErrorException } from '@nestjs/common';
import { AnalyticsService } from '@/resources/analytics/analytics.service';
import { User } from '@/resources/user/schemas/user.schema';
import { Campaign } from '@/resources/campaign/schemas/campaign.schema';
import { Character } from '@/resources/character/core/schemas/character.schema';

function leanExec<T>(value: T) {
  return { lean: () => ({ exec: jest.fn().mockResolvedValue(value) }) };
}

function countExec(value: number) {
  return { exec: jest.fn().mockResolvedValue(value) };
}

describe('FR-admin-business-kpis — Adventure AnalyticsService', () => {
  let service: AnalyticsService;
  let userModel: {
    find: jest.Mock;
    aggregate: jest.Mock;
    countDocuments: jest.Mock;
  };
  let campaignModel: { find: jest.Mock };
  let characterModel: { find: jest.Mock };

  const from = new Date('2026-09-01T00:00:00.000Z');
  const to = new Date('2026-09-30T23:59:59.999Z');

  beforeEach(async () => {
    userModel = {
      find: jest.fn(),
      aggregate: jest.fn(),
      countDocuments: jest.fn(),
    };
    campaignModel = { find: jest.fn() };
    characterModel = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Campaign.name), useValue: campaignModel },
        { provide: getModelToken(Character.name), useValue: characterModel },
      ],
    }).compile();

    service = module.get(AnalyticsService);
  });

  it('nominal: returns acquisition, economy and content KPIs for a populated period', async () => {
    const createdAt = new Date('2026-09-10T12:00:00.000Z');
    userModel.find.mockReturnValue(
      leanExec([
        {
          keycloakId: '11111111-1111-4111-8111-111111111111',
          createdAt,
          history: [],
        },
      ]),
    );
    userModel.aggregate
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([{ total: 12 }]),
      })
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([{ total: 5 }]),
      })
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([{ total: 3 }]),
      });
    userModel.countDocuments
      .mockReturnValueOnce(countExec(2))
      .mockReturnValueOnce(countExec(1))
      .mockReturnValueOnce(countExec(1));
    campaignModel.find
      .mockReturnValueOnce(
        leanExec([
          { _id: { toString: () => 'camp-1' }, createdBy: 'u1', createdAt },
        ]),
      )
      .mockReturnValueOnce(
        leanExec([
          {
            createdBy: '11111111-1111-4111-8111-111111111111',
            createdAt: new Date('2026-09-10T18:00:00.000Z'),
          },
        ]),
      );
    characterModel.find.mockReturnValue(
      leanExec([
        {
          createdBy: '11111111-1111-4111-8111-111111111111',
          createdAt: new Date('2026-09-10T14:00:00.000Z'),
        },
      ]),
    );

    const result = await service.getBusiness('daily', from, to);

    expect(result.funnel.acquisition).toBe(1);
    expect(result.economy.wheelsInCirculation).toBe(12);
    expect(result.economy.wheelsSold).toBe(5);
    expect(result.economy.wheelsSpent).toBe(3);
    expect(result.economy.unusedGiftUsers).toBe(2);
    expect(result.economy.spentGiftNeverBought).toBe(1);
    expect(result.economy.blockedUsers).toBe(3);
    expect(result.economy.giftToPaidRate).toBe(100);
    expect(result.content.campaignIdsCreated).toEqual(['camp-1']);
    expect(result.content.medianHoursToFirstPlayer).toBe(2);
    expect(result.content.medianHoursToFirstCampaign).toBe(6);
  });

  it('edge: empty period returns zeros and null medians', async () => {
    userModel.find.mockReturnValue(leanExec([]));
    userModel.aggregate.mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });
    userModel.countDocuments
      .mockReturnValueOnce(countExec(0))
      .mockReturnValueOnce(countExec(0))
      .mockReturnValueOnce(countExec(0));
    campaignModel.find
      .mockReturnValue(leanExec([]))
      .mockReturnValue(leanExec([]));
    characterModel.find.mockReturnValue(leanExec([]));

    const result = await service.getBusiness('daily', from, to);

    expect(result.funnel.acquisition).toBe(0);
    expect(result.economy.wheelsInCirculation).toBe(0);
    expect(result.economy.giftToPaidRate).toBe(0);
    expect(result.content.medianHoursToFirstPlayer).toBeNull();
    expect(result.content.campaignIdsCreated).toEqual([]);
  });

  it('edge: unused-gift count uses balance 1 without expenses', async () => {
    userModel.find.mockReturnValue(leanExec([]));
    userModel.aggregate.mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });
    userModel.countDocuments
      .mockReturnValueOnce(countExec(4))
      .mockReturnValueOnce(countExec(0))
      .mockReturnValueOnce(countExec(0));
    campaignModel.find.mockReturnValue(leanExec([]));
    characterModel.find.mockReturnValue(leanExec([]));

    const result = await service.getBusiness('daily', from, to);

    expect(result.economy.unusedGiftUsers).toBe(4);
    expect(result.economy.spentGiftNeverBought).toBe(0);
    expect(result.economy.blockedUsers).toBe(4);
    expect(userModel.countDocuments.mock.calls[0][0]).toMatchObject({
      balance: 1,
    });
  });

  it('edge: blockedUsers is the sum of unused gift and spent-gift-never-bought', async () => {
    userModel.find.mockReturnValue(leanExec([]));
    userModel.aggregate.mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });
    userModel.countDocuments
      .mockReturnValueOnce(countExec(2))
      .mockReturnValueOnce(countExec(5))
      .mockReturnValueOnce(countExec(0));
    campaignModel.find.mockReturnValue(leanExec([]));
    characterModel.find.mockReturnValue(leanExec([]));

    const result = await service.getBusiness('daily', from, to);

    expect(result.economy.unusedGiftUsers).toBe(2);
    expect(result.economy.spentGiftNeverBought).toBe(5);
    expect(result.economy.blockedUsers).toBe(7);
    expect(userModel.countDocuments.mock.calls[1][0]).toMatchObject({
      balance: 0,
    });
    expect(userModel.countDocuments.mock.calls[1][0].$or).toBeUndefined();
  });

  it('failure: wraps repository errors', async () => {
    userModel.find.mockImplementation(() => {
      throw new Error('mongo down');
    });

    await expect(service.getBusiness('daily', from, to)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
