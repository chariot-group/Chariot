jest.mock('@keycloak/keycloak-admin-client', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { InternalServerErrorException } from '@nestjs/common';
import {
  TOKEN_PURCHASE_CAMPAIGN_NAME,
  UserService,
} from '@/resources/user/user.service';
import { User } from '@/resources/user/schemas/user.schema';
import { KeycloakService } from '@/resources/user/keycloak.service';

describe('UserService - addTokens', () => {
  let service: UserService;
  let userModel: {
    findOne: jest.Mock;
  };

  const keycloakId = '11111111-1111-4111-8111-111111111111';

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: KeycloakService, useValue: {} },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('nominal: credits balance and appends a negative purchase history entry', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const user = {
      balance: 4,
      history: [],
      save,
    };
    userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });

    await service.addTokens(keycloakId, 10);

    expect(user.balance).toBe(14);
    expect(user.history).toHaveLength(1);
    expect(user.history[0]).toMatchObject({
      campaignName: TOKEN_PURCHASE_CAMPAIGN_NAME,
      value: -10,
    });
    expect(user.history[0].date).toBeInstanceOf(Date);
    expect(save).toHaveBeenCalled();
  });

  it('error: throws when user is not found', async () => {
    userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    await expect(service.addTokens(keycloakId, 5)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
