import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SessionAccessService } from '@/common/session/session-access.service';

// @see FR-user-public-profile-read-access: User Profile Read Access by ID
describe('SessionAccessService - assertUserCoParticipant', () => {
  let service: SessionAccessService;
  let fetchMock: jest.Mock;

  const authHeader = 'Bearer valid-jwt';
  const sessionCode = 'CODE123';
  const targetUserId = '22222222-2222-4222-8222-222222222222';

  beforeEach(async () => {
    fetchMock = jest.fn();
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionAccessService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<SessionAccessService>(SessionAccessService);
  });

  it('nominal: resolves when the session service grants co-participation access', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    await expect(
      service.assertUserCoParticipant(authHeader, sessionCode, targetUserId),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        `/sessions/${sessionCode}/validate-co-participant`,
      ),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: authHeader }),
        body: JSON.stringify({ targetUserId }),
      }),
    );
  });

  it('edge: rejects with ForbiddenException when no authorization header is provided', async () => {
    await expect(
      service.assertUserCoParticipant(undefined, sessionCode, targetUserId),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('error: rejects with ForbiddenException when the session service denies access', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });

    await expect(
      service.assertUserCoParticipant(authHeader, sessionCode, targetUserId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('error: rejects with NotFoundException when the session does not exist', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    await expect(
      service.assertUserCoParticipant(authHeader, sessionCode, targetUserId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('error: rejects with ForbiddenException when the session is closed (410)', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 410 });

    await expect(
      service.assertUserCoParticipant(authHeader, sessionCode, targetUserId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('error: rejects with ServiceUnavailableException when the session service answers 5xx', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    await expect(
      service.assertUserCoParticipant(authHeader, sessionCode, targetUserId),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('error: rejects with ServiceUnavailableException when the session service is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED'));

    await expect(
      service.assertUserCoParticipant(authHeader, sessionCode, targetUserId),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
