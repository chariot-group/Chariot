jest.mock('@keycloak/keycloak-admin-client', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });

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
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(service.addTokens(keycloakId, 5)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});

describe('UserService - updateUser preferredLocale', () => {
  let service: UserService;
  let userModel: {
    findOne: jest.Mock;
    create: jest.Mock;
  };
  let keycloakService: {
    updateUser: jest.Mock;
    getUserById: jest.Mock;
  };

  const keycloakId = '11111111-1111-4111-8111-111111111111';

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    keycloakService = {
      updateUser: jest.fn().mockResolvedValue(undefined),
      getUserById: jest.fn().mockResolvedValue({
        id: keycloakId,
        email: 'user@example.com',
        username: 'player',
        firstName: 'John',
        lastName: 'Doe',
        attributes: {},
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: KeycloakService, useValue: keycloakService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('nominal: persists preferredLocale on the user record', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const user = {
      keycloakId,
      balance: 1,
      history: [],
      preferredLocale: 'fr',
      save,
    };
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });

    const response = await service.updateUser(keycloakId, {
      firstName: 'John',
      preferredLocale: 'es',
    });

    expect(keycloakService.updateUser).toHaveBeenCalledWith(keycloakId, {
      firstName: 'John',
    });
    expect(user.preferredLocale).toBe('es');
    expect(save).toHaveBeenCalled();
    expect(response.data.preferredLocale).toBe('es');
  });

  it('edge: leaves preferredLocale unchanged when omitted', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const user = {
      keycloakId,
      balance: 1,
      history: [],
      preferredLocale: 'fr',
      save,
    };
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });

    const response = await service.updateUser(keycloakId, {
      firstName: 'Jane',
    });

    expect(save).not.toHaveBeenCalled();
    expect(response.data.preferredLocale).toBe('fr');
  });
});

// @see FR-user-public-profile-read-access: User Profile Read Access by ID
describe('UserService - findPublicProfile', () => {
  let service: UserService;
  let userModel: Record<string, jest.Mock>;
  let keycloakService: {
    getUserById: jest.Mock;
  };

  const targetId = '22222222-2222-4222-8222-222222222222';

  beforeEach(async () => {
    userModel = {};
    keycloakService = {
      getUserById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: KeycloakService, useValue: keycloakService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('nominal: returns only public display fields, never email/balance/history', async () => {
    keycloakService.getUserById.mockResolvedValue({
      id: targetId,
      email: 'victim@example.com',
      username: 'victim',
      firstName: 'Victim',
      lastName: 'User',
      attributes: { avatar: ['https://example.com/avatar.png'] },
    });

    const response = await service.findPublicProfile(targetId);

    expect(response.data).toEqual({
      keycloakId: targetId,
      username: 'victim',
      firstName: 'Victim',
      lastName: 'User',
      avatar: 'https://example.com/avatar.png',
    });
    expect(response.data).not.toHaveProperty('email');
    expect(response.data).not.toHaveProperty('balance');
    expect(response.data).not.toHaveProperty('history');
    // No DB lookup needed for a public profile — only Keycloak fields are exposed
    expect(userModel.findOne).toBeUndefined();
  });

  it('edge: missing avatar attribute resolves to null, not an error', async () => {
    keycloakService.getUserById.mockResolvedValue({
      id: targetId,
      email: 'victim@example.com',
      username: 'victim',
      firstName: 'Victim',
      lastName: 'User',
      attributes: {},
    });

    const response = await service.findPublicProfile(targetId);

    expect(response.data.avatar).toBeNull();
  });

  it('failure: throws NotFoundException when the user does not exist in Keycloak', async () => {
    keycloakService.getUserById.mockResolvedValue(null);

    await expect(service.findPublicProfile(targetId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('failure: wraps unexpected errors as InternalServerErrorException', async () => {
    keycloakService.getUserById.mockRejectedValue(new Error('Keycloak down'));

    await expect(service.findPublicProfile(targetId)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
