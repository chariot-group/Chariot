jest.mock('@keycloak/keycloak-admin-client', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserService } from '@/resources/user/user.service';
import { User } from '@/resources/user/schemas/user.schema';
import { KeycloakService } from '@/resources/user/keycloak.service';

describe('UserService - balance integrity', () => {
  let service: UserService;
  let userModel: {
    findOne: jest.Mock;
  };
  let saveMock: jest.Mock;

  const keycloakId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    saveMock = jest.fn().mockResolvedValue(undefined);
    userModel = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: userModel },
        {
          provide: KeycloakService,
          useValue: {
            getUserById: jest.fn().mockResolvedValue({
              id: keycloakId,
              email: 'user@test.com',
              username: 'testuser',
              firstName: 'Test',
              lastName: 'User',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('addHistory', () => {
    it('should debit balance when sufficient tokens are available', async () => {
      const user = {
        keycloakId,
        balance: 2,
        history: [],
        save: saveMock,
      };
      userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });

      const result = await service.addHistory(keycloakId, {
        campaignName: 'Summer Campaign',
        value: 1,
      });

      expect(user.balance).toBe(1);
      expect(user.history).toHaveLength(1);
      expect(saveMock).toHaveBeenCalled();
      expect(result.data.balance).toBe(1);
    });

    it('should reject debit that would make balance negative', async () => {
      const user = {
        keycloakId,
        balance: 0,
        history: [],
        save: saveMock,
      };
      userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });

      await expect(
        service.addHistory(keycloakId, {
          campaignName: 'Summer Campaign',
          value: 1,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(saveMock).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(
        service.addHistory(keycloakId, {
          campaignName: 'Summer Campaign',
          value: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBalance', () => {
    it('should return the current balance', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ balance: 5 }),
      });

      await expect(service.getBalance(keycloakId)).resolves.toBe(5);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.getBalance(keycloakId)).rejects.toThrow(NotFoundException);
    });
  });
});
