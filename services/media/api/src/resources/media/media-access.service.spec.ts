/**
 * @see FR-media-avatar-read-access
 */
import {
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaAccessService } from '@/resources/media/media-access.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeConfigService(
  overrides: Record<string, string> = {},
): ConfigService {
  return {
    get: (key: string) =>
      ({
        ADVENTURE_INTERNAL_URL: 'http://adventure:9000',
        CHARIOT_SESSION_API_URL: 'http://session:9002',
        INTERNAL_SERVICE_SECRET: 'test-secret',
        ...overrides,
      })[key] ?? undefined,
  } as unknown as ConfigService;
}

function makeCharacterOwner(
  overrides: Partial<{
    createdBy: string;
    avatar: string | null;
    kind: string;
  }> = {},
) {
  return {
    createdBy: 'owner-uuid',
    avatar: 'avatars/characters/player/char-id/main.webp',
    kind: 'player',
    ...overrides,
  };
}

const AUTH_HEADER = 'Bearer token-abc';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MediaAccessService', () => {
  let service: MediaAccessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaAccessService,
        { provide: ConfigService, useValue: makeConfigService() },
      ],
    }).compile();

    service = module.get<MediaAccessService>(MediaAccessService);
    jest.clearAllMocks();
  });

  // ── assertUserSelfAccess ──────────────────────────────────────────────────

  describe('assertUserSelfAccess', () => {
    it('should not throw when targetUserId matches requesterId', () => {
      expect(() =>
        service.assertUserSelfAccess('user-1', 'user-1'),
      ).not.toThrow();
    });

    it('should throw ForbiddenException when targetUserId differs from requesterId', () => {
      expect(() => service.assertUserSelfAccess('user-1', 'user-2')).toThrow(
        ForbiddenException,
      );
    });
  });

  // ── assertUserAvatarReadAccess ────────────────────────────────────────────

  describe('assertUserAvatarReadAccess', () => {
    it('should allow self read without sessionCode', async () => {
      await expect(
        service.assertUserAvatarReadAccess('user-1', 'user-1', AUTH_HEADER),
      ).resolves.toBeUndefined();
    });

    it('should allow GM profile read when requester is session participant', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true });

      await expect(
        service.assertUserAvatarReadAccess(
          'gm-uuid',
          'player-uuid',
          AUTH_HEADER,
          'CODE01',
        ),
      ).resolves.toBeUndefined();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://session:9002/sessions/CODE01/validate-gm-ownership',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ targetUserId: 'gm-uuid' }),
        }),
      );
    });

    it('should throw ForbiddenException when reading another user avatar without sessionCode', async () => {
      await expect(
        service.assertUserAvatarReadAccess(
          'other-user',
          'requester',
          AUTH_HEADER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when session denies access (non-GM target)', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });

      await expect(
        service.assertUserAvatarReadAccess(
          'player-uuid',
          'other-player',
          AUTH_HEADER,
          'CODE01',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when auth header is missing', async () => {
      await expect(
        service.assertUserAvatarReadAccess(
          'gm-uuid',
          'player-uuid',
          undefined,
          'CODE01',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ServiceUnavailableException when session service is unreachable', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(
        service.assertUserAvatarReadAccess(
          'gm-uuid',
          'player-uuid',
          AUTH_HEADER,
          'CODE01',
        ),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // ── assertCharacterReadAccess (PJ) ────────────────────────────────────────

  describe('assertCharacterReadAccess — PJ (kind: player)', () => {
    it('should allow owner read without sessionCode', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          makeCharacterOwner({ createdBy: 'owner-uuid', kind: 'player' }),
      });

      await expect(
        service.assertCharacterReadAccess('char-id', 'owner-uuid', AUTH_HEADER),
      ).resolves.toMatchObject({ createdBy: 'owner-uuid' });
    });

    it('should allow roster-read in session for a PJ', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () =>
            makeCharacterOwner({ createdBy: 'other-uuid', kind: 'player' }),
        })
        .mockResolvedValueOnce({ ok: true });

      await expect(
        service.assertCharacterReadAccess(
          'char-id',
          'requester-uuid',
          AUTH_HEADER,
          'CODE01',
        ),
      ).resolves.toMatchObject({ createdBy: 'other-uuid' });

      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'http://session:9002/sessions/CODE01/validate-character-access',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should throw ForbiddenException for non-owner PJ without sessionCode', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          makeCharacterOwner({ createdBy: 'other-uuid', kind: 'player' }),
      });

      await expect(
        service.assertCharacterReadAccess(
          'char-id',
          'requester-uuid',
          AUTH_HEADER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reuse cached character owner within TTL for repeated reads', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          makeCharacterOwner({ createdBy: 'owner-uuid', kind: 'player' }),
      });

      await service.assertCharacterReadAccess(
        'char-id',
        'owner-uuid',
        AUTH_HEADER,
      );
      await service.assertCharacterReadAccess(
        'char-id',
        'owner-uuid',
        AUTH_HEADER,
      );

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  // ── assertCharacterReadAccess (PNJ) ───────────────────────────────────────

  describe('assertCharacterReadAccess — PNJ (kind: npc)', () => {
    it('should allow GM owner read of their own NPC', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          makeCharacterOwner({ createdBy: 'gm-uuid', kind: 'npc' }),
      });

      await expect(
        service.assertCharacterReadAccess('npc-id', 'gm-uuid', AUTH_HEADER),
      ).resolves.toMatchObject({ createdBy: 'gm-uuid', kind: 'npc' });
    });

    it('should allow session participant to read NPC created by session GM', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () =>
            makeCharacterOwner({ createdBy: 'gm-uuid', kind: 'npc' }),
        })
        .mockResolvedValueOnce({ ok: true });

      await expect(
        service.assertCharacterReadAccess(
          'npc-id',
          'player-uuid',
          AUTH_HEADER,
          'CODE01',
        ),
      ).resolves.toMatchObject({ createdBy: 'gm-uuid', kind: 'npc' });

      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'http://session:9002/sessions/CODE01/validate-gm-ownership',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ targetUserId: 'gm-uuid' }),
        }),
      );
    });

    it('should throw ForbiddenException when NPC creator is not the session GM', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () =>
            makeCharacterOwner({ createdBy: 'other-gm', kind: 'npc' }),
        })
        .mockResolvedValueOnce({ ok: false, status: 403 });

      await expect(
        service.assertCharacterReadAccess(
          'npc-id',
          'player-uuid',
          AUTH_HEADER,
          'CODE01',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for NPC without sessionCode and non-owner', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          makeCharacterOwner({ createdBy: 'gm-uuid', kind: 'npc' }),
      });

      await expect(
        service.assertCharacterReadAccess('npc-id', 'player-uuid', AUTH_HEADER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── assertCharacterReadAccess (adventure unreachable) ─────────────────────

  describe('assertCharacterReadAccess — adventure service errors', () => {
    it('should throw NotFoundException when adventure returns 404', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

      await expect(
        service.assertCharacterReadAccess(
          'missing-char',
          'user-1',
          AUTH_HEADER,
          'CODE01',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ServiceUnavailableException when adventure service is unreachable', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(
        service.assertCharacterReadAccess(
          'char-id',
          'user-1',
          AUTH_HEADER,
          'CODE01',
        ),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('refreshCharacterOwnerCache', () => {
    it('should serve updated avatar on subsequent read without refetching adventure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => makeCharacterOwner({ avatar: null }),
      });

      const before = await service.assertCharacterReadAccess(
        'char-id',
        'owner-uuid',
        AUTH_HEADER,
      );
      expect(before.avatar).toBeNull();

      service.refreshCharacterOwnerCache('char-id', {
        createdBy: 'owner-uuid',
        avatar: 'avatars/characters/char-id/main.webp',
        kind: 'player',
      });

      const after = await service.assertCharacterReadAccess(
        'char-id',
        'owner-uuid',
        AUTH_HEADER,
      );

      expect(after.avatar).toBe('avatars/characters/char-id/main.webp');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
