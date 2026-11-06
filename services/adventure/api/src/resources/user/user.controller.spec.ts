jest.mock('@keycloak/keycloak-admin-client', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UserController } from '@/resources/user/user.controller';
import { UserService } from '@/resources/user/user.service';
import { SessionAccessService } from '@/common/session/session-access.service';

// @see FR-user-public-profile-read-access: User Profile Read Access by ID
describe('UserController - findById', () => {
  let controller: UserController;
  let userService: { findPublicProfile: jest.Mock };
  let sessionAccessService: { assertUserCoParticipant: jest.Mock };

  const requesterId = '11111111-1111-4111-8111-111111111111';
  const targetId = '22222222-2222-4222-8222-222222222222';
  const sessionCode = 'CODE123';

  const makeRequest = (authorization = 'Bearer valid-jwt') => ({
    user: { keycloakId: requesterId },
    headers: { authorization },
  });

  beforeEach(async () => {
    userService = {
      findPublicProfile: jest.fn().mockResolvedValue({
        message: 'ok',
        data: {
          keycloakId: targetId,
          username: 'target',
          firstName: 'Target',
          lastName: 'User',
          avatar: null,
        },
      }),
    };
    sessionAccessService = {
      assertUserCoParticipant: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: SessionAccessService, useValue: sessionAccessService },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('nominal: grants access and returns the public profile when caller and target share a session', async () => {
    const result = await controller.findById(
      targetId,
      makeRequest(),
      sessionCode,
    );

    expect(sessionAccessService.assertUserCoParticipant).toHaveBeenCalledWith(
      'Bearer valid-jwt',
      sessionCode,
      targetId,
    );
    expect(userService.findPublicProfile).toHaveBeenCalledWith(targetId);
    expect(result.data).not.toHaveProperty('email');
    expect(result.data).not.toHaveProperty('balance');
    expect(result.data).not.toHaveProperty('history');
  });

  it('edge: allows a self-lookup without a sessionCode', async () => {
    await controller.findById(requesterId, makeRequest(), undefined);

    expect(sessionAccessService.assertUserCoParticipant).not.toHaveBeenCalled();
    expect(userService.findPublicProfile).toHaveBeenCalledWith(requesterId);
  });

  it('failure: throws ForbiddenException when sessionCode is missing for another user', async () => {
    await expect(
      controller.findById(targetId, makeRequest(), undefined),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(sessionAccessService.assertUserCoParticipant).not.toHaveBeenCalled();
    expect(userService.findPublicProfile).not.toHaveBeenCalled();
  });

  it('edge: trims the sessionCode before validating co-participation', async () => {
    await controller.findById(targetId, makeRequest(), `  ${sessionCode} `);

    expect(sessionAccessService.assertUserCoParticipant).toHaveBeenCalledWith(
      'Bearer valid-jwt',
      sessionCode,
      targetId,
    );
  });

  it.each([
    ['blank', '   '],
    ['duplicated', ['CODE123', 'OTHER']],
  ])(
    'failure: throws ForbiddenException for a %s sessionCode',
    async (_label, invalidCode) => {
      await expect(
        controller.findById(targetId, makeRequest(), invalidCode),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(
        sessionAccessService.assertUserCoParticipant,
      ).not.toHaveBeenCalled();
      expect(userService.findPublicProfile).not.toHaveBeenCalled();
    },
  );

  it('failure: propagates the co-participation check rejection without returning profile data', async () => {
    sessionAccessService.assertUserCoParticipant.mockRejectedValue(
      new ForbiddenException('Session co-participation access denied'),
    );

    await expect(
      controller.findById(targetId, makeRequest(), sessionCode),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(userService.findPublicProfile).not.toHaveBeenCalled();
  });
});
