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
};

@Injectable()
export class MediaAccessService {
  private readonly logger = new Logger(MediaAccessService.name);
  private readonly adventureBaseUrl: string;
  private readonly sessionBaseUrl: string;
  private readonly internalSecret: string;
  private readonly inflight = new Map<string, Promise<void>>();

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

    await this.assertSessionRosterRead(authHeader, code, characterId);

    return character;
  }

  assertUserSelfAccess(targetUserId: string, requesterId: string): void {
    if (targetUserId !== requesterId) {
      throw new ForbiddenException(
        'You can only modify your own profile avatar',
      );
    }
  }

  private async fetchCharacterOwner(
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
    await this.postSessionValidate(
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
    await this.postSessionValidate(
      authHeader,
      sessionCode,
      characterId,
      'gm-edit',
    );
  }

  private dedupeKey(
    authHeader: string,
    sessionCode: string,
    characterId: string,
    mode: 'roster-read' | 'gm-edit',
  ): string {
    return `${authHeader}\0${sessionCode.trim()}\0${characterId.trim()}\0${mode}`;
  }

  private async postSessionValidate(
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
