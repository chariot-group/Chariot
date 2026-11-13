import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Logger } from '@nestjs/common';
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
          useValue: {
            get: jest.fn((key: string) =>
              key === 'NODE_ENV' ? 'test' : undefined,
            ),
          },
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

// @see FR-user-public-profile-read-access: sans URL du service session, noms/avatars/fiches échouent en 503
describe('SessionAccessService - CHARIOT_SESSION_API_URL configuration', () => {
  const build = (env: Record<string, string | undefined>) =>
    new SessionAccessService({
      get: (key: string) => env[key],
    } as unknown as ConfigService);

  afterEach(() => jest.restoreAllMocks());

  it('nominal: uses the configured URL (trailing slash stripped) without error log', async () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;

    const service = build({
      CHARIOT_SESSION_API_URL: 'http://chariot-session-integ:9002/',
      NODE_ENV: 'integration',
    });
    await service.assertUserCoParticipant('Bearer jwt', 'CODE', 'user-2');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://chariot-session-integ:9002/sessions/CODE/validate-co-participant',
      expect.anything(),
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('failure: logs an error when the URL is missing in a deployed environment', () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    build({ NODE_ENV: 'integration' });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('CHARIOT_SESSION_API_URL is not set'),
    );
  });

  it('edge: stays silent when the URL is missing in development or test', () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    build({ NODE_ENV: 'development' });
    build({ NODE_ENV: 'test' });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('regression: every adventure and media compose file injects CHARIOT_SESSION_API_URL', () => {
    const servicesDir = join(__dirname, '../../../../..');
    const files = ['dev', 'integ', 'prod'].flatMap((env) => [
      join(servicesDir, 'adventure', `compose.${env}.yml`),
      join(servicesDir, 'media', `compose.${env}.yml`),
    ]);
    const present = files.filter((f) => existsSync(f));
    expect(present.length).toBeGreaterThan(0);
    for (const file of present) {
      expect({
        file,
        injected: readFileSync(file, 'utf8').includes(
          'CHARIOT_SESSION_API_URL:',
        ),
      }).toEqual({ file, injected: true });
    }
  });
});
