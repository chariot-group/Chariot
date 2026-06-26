import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type CharacterOwnerResponse = {
  createdBy: string;
  avatar: string | null;
  kind: string;
};

@Injectable()
export class MediaAccessService {
  private readonly logger = new Logger(MediaAccessService.name);
  private readonly adventureBaseUrl: string;
  private readonly sessionBaseUrl: string;
  private readonly internalSecret: string;
  private readonly inflight = new Map<string, Promise<void>>();
  private readonly ownerInflight = new Map<
    string,
    Promise<CharacterOwnerResponse>
  >();

  private readonly ownerCache = new Map<
    string,
    { value: CharacterOwnerResponse; expiresAt: number }
  >();
  private readonly OWNER_CACHE_TTL_MS = 60_000;

  constructor(private readonly configService: ConfigService) {
    this.adventureBaseUrl = (
      this.configService.get<string>('ADVENTURE_INTERNAL_URL') ??
      'http://localhost:9000'
    ).replace(/\/$/, '');

    this.sessionBaseUrl = (
      this.configService.get<string>('CHARIOT_SESSION_API_URL') ??
      'http://localhost:9002'
    ).replace(/\/$/, '');

    this.internalSecret =
      this.configService.get<string>('INTERNAL_SERVICE_SECRET') ?? '';
  }

  async assertCharacterWriteAccess(
    characterId: string,
    requesterId: string,
    authHeader: string | undefined,
    sessionCode?: string,
  ): Promise<CharacterOwnerResponse> {
    const character = await this.fetchCharacterOwner(characterId);

    if (character.createdBy === requesterId) {
      return character;
    }

    const code = sessionCode?.trim();
    if (!code) {
      throw new ForbiddenException(
        'You can only update avatars for your own characters outside of an authorized session',
      );
    }

    await this.assertSessionGmEdit(authHeader, code, characterId);

    return character;
  }

  /**
   * Contrôle d'accès en lecture sur un avatar personnage (PJ ou PNJ).
   *
   * - PJ : owner OU participant de session avec le PJ dans le roster (roster-read).
   * - PNJ : owner OU participant de session dont le créateur est le MJ (npc-session-read).
   *
   * @see FR-media-avatar-read-access
   */
  async assertCharacterReadAccess(
    characterId: string,
    requesterId: string,
    authHeader: string | undefined,
    sessionCode?: string,
  ): Promise<CharacterOwnerResponse> {
    const character = await this.fetchCharacterOwner(characterId);

    if (character.createdBy === requesterId) {
      return character;
    }

    const code = sessionCode?.trim();
    if (!code) {
      throw new ForbiddenException(
        'You can only view avatars for your own characters without an active session context',
      );
    }

    if (character.kind === 'npc') {
      await this.assertSessionGmOwnership(
        authHeader,
        code,
        character.createdBy,
      );
    } else {
      await this.assertSessionRosterRead(authHeader, code, characterId);
    }

    return character;
  }

  /**
   * Contrôle d'accès en lecture sur un avatar utilisateur (photo de profil).
   *
   * - Self : toujours autorisé.
   * - En session : le requester doit être participant et targetUserId doit être le MJ.
   * - Sinon : 403.
   *
   * @see FR-media-avatar-read-access
   */
  async assertUserAvatarReadAccess(
    targetUserId: string,
    requesterId: string,
    authHeader: string | undefined,
    sessionCode?: string,
  ): Promise<void> {
    if (targetUserId === requesterId) {
      return;
    }

    const code = sessionCode?.trim();
    if (!code) {
      throw new ForbiddenException(
        'You can only view your own profile avatar without an active session context',
      );
    }

    await this.assertSessionGmOwnership(authHeader, code, targetUserId);
  }

  assertUserSelfAccess(targetUserId: string, requesterId: string): void {
    if (targetUserId !== requesterId) {
      throw new ForbiddenException(
        'You can only modify your own profile avatar',
      );
    }
  }

  /**
   * Refreshes the in-memory owner cache after avatar write (upload/delete).
   * Without this, presigned-read can serve stale empty avatar for up to OWNER_CACHE_TTL_MS.
   */
  refreshCharacterOwnerCache(
    characterId: string,
    next: CharacterOwnerResponse,
  ): void {
    this.ownerInflight.delete(`owner:${characterId}`);
    this.ownerCache.set(characterId, {
      value: next,
      expiresAt: Date.now() + this.OWNER_CACHE_TTL_MS,
    });
  }

  private async fetchCharacterOwner(
    characterId: string,
  ): Promise<CharacterOwnerResponse> {
    const now = Date.now();
    const cached = this.ownerCache.get(characterId);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const inflightKey = `owner:${characterId}`;
    const pending = this.ownerInflight.get(inflightKey);
    if (pending) {
      return pending;
    }

    const run = this.executeFetchCharacterOwner(characterId)
      .then((value) => {
        this.ownerCache.set(characterId, {
          value,
          expiresAt: Date.now() + this.OWNER_CACHE_TTL_MS,
        });
        return value;
      })
      .finally(() => {
        this.ownerInflight.delete(inflightKey);
      });

    this.ownerInflight.set(inflightKey, run);
    return run;
  }

  private async executeFetchCharacterOwner(
    characterId: string,
  ): Promise<CharacterOwnerResponse> {
    const url = `${this.adventureBaseUrl}/characters/internal/${encodeURIComponent(characterId)}/owner`;

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'x-internal-service-secret': this.internalSecret,
        },
      });

      if (res.status === 404) {
        throw new NotFoundException(`Character ${characterId} not found`);
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.error(
          `Adventure service returned ${res.status} for character owner lookup: ${text}`,
        );
        throw new ServiceUnavailableException(
          'Could not verify character ownership',
        );
      }

      return (await res.json()) as CharacterOwnerResponse;
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof ForbiddenException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      const message = `Adventure service unreachable: ${(err as Error).message}`;
      this.logger.error(message, (err as Error).stack);
      throw new ServiceUnavailableException(
        'Could not verify character ownership',
      );
    }
  }

  private async assertSessionRosterRead(
    authHeader: string | undefined,
    sessionCode: string,
    characterId: string,
  ): Promise<void> {
    await this.postSessionValidateCharacter(
      authHeader,
      sessionCode,
      characterId,
      'roster-read',
    );
  }

  private async assertSessionGmEdit(
    authHeader: string | undefined,
    sessionCode: string,
    characterId: string,
  ): Promise<void> {
    await this.postSessionValidateCharacter(
      authHeader,
      sessionCode,
      characterId,
      'gm-edit',
    );
  }

  /**
   * Vérifie que le requester est participant de la session ET que targetUserId est le MJ.
   * Utilisé pour la PP du MJ (scope user) et les avatars PNJ (kind=npc).
   * @see FR-media-avatar-read-access
   */
  private async assertSessionGmOwnership(
    authHeader: string | undefined,
    sessionCode: string,
    targetUserId: string,
  ): Promise<void> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException(
        'Missing or invalid authorization for session access',
      );
    }

    const key = `gm-ownership\0${authHeader}\0${sessionCode.trim()}\0${targetUserId.trim()}`;
    const pending = this.inflight.get(key);
    if (pending) {
      return pending;
    }

    const run = this.executeGmOwnershipValidate(
      authHeader,
      sessionCode,
      targetUserId,
    ).finally(() => {
      this.inflight.delete(key);
    });

    this.inflight.set(key, run);
    return run;
  }

  private async executeGmOwnershipValidate(
    authHeader: string,
    sessionCode: string,
    targetUserId: string,
  ): Promise<void> {
    const url = `${this.sessionBaseUrl}/sessions/${encodeURIComponent(sessionCode)}/validate-gm-ownership`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ targetUserId }),
      });

      if (res.ok) {
        return;
      }

      this.logger.verbose(
        `GM ownership denied: HTTP ${res.status} for targetUserId ${targetUserId} in session ${sessionCode}`,
      );
      throw new ForbiddenException('Session GM ownership access denied');
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      const message = `Session service unreachable: ${(err as Error).message}`;
      this.logger.error(message, (err as Error).stack);
      throw new ServiceUnavailableException(
        'Could not validate session GM ownership',
      );
    }
  }

  private dedupeKey(
    authHeader: string,
    sessionCode: string,
    characterId: string,
    mode: 'roster-read' | 'gm-edit',
  ): string {
    return `${authHeader}\0${sessionCode.trim()}\0${characterId.trim()}\0${mode}`;
  }

  private async postSessionValidateCharacter(
    authHeader: string | undefined,
    sessionCode: string,
    characterId: string,
    mode: 'roster-read' | 'gm-edit',
  ): Promise<void> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException(
        'Missing or invalid authorization for session access',
      );
    }

    const key = this.dedupeKey(authHeader, sessionCode, characterId, mode);
    const pending = this.inflight.get(key);
    if (pending) {
      return pending;
    }

    const run = this.executeSessionValidate(
      authHeader,
      sessionCode,
      characterId,
      mode,
    ).finally(() => {
      this.inflight.delete(key);
    });

    this.inflight.set(key, run);
    return run;
  }

  private async executeSessionValidate(
    authHeader: string,
    sessionCode: string,
    characterId: string,
    mode: 'roster-read' | 'gm-edit',
  ): Promise<void> {
    const url = `${this.sessionBaseUrl}/sessions/${encodeURIComponent(sessionCode)}/validate-character-access`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ characterId, mode }),
      });

      if (res.ok) {
        return;
      }

      this.logger.verbose(
        `Session access denied: HTTP ${res.status} for ${mode} character ${characterId}`,
      );
      throw new ForbiddenException('Session character access denied');
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      const message = `Session service unreachable: ${(err as Error).message}`;
      this.logger.error(message, (err as Error).stack);
      throw new ServiceUnavailableException(
        'Could not validate session access',
      );
    }
  }
}
