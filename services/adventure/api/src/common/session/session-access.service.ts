import {
  Injectable,
  Logger,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionAccessService {
  private readonly logger = new Logger(SessionAccessService.name);
  private readonly baseUrl: string;
  /** Évite des POST dupliqués (ex. lecture fiche + requêtes parallèles) pour la même validation. */
  private readonly inflight = new Map<string, Promise<void>>();

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = (
      this.configService.get<string>('CHARIOT_SESSION_API_URL') ??
      'http://localhost:9002'
    ).replace(/\/$/, '');
  }

  async assertRosterRead(
    authHeader: string | undefined,
    sessionCode: string,
    characterId: string,
    linkedPlayerId?: string,
  ): Promise<void> {
    await this.postValidate(
      authHeader,
      sessionCode,
      characterId,
      'roster-read',
      linkedPlayerId,
    );
  }

  async assertGmEdit(
    authHeader: string | undefined,
    sessionCode: string,
    characterId: string,
    linkedPlayerId?: string,
  ): Promise<void> {
    await this.postValidate(
      authHeader,
      sessionCode,
      characterId,
      'gm-edit',
      linkedPlayerId,
    );
  }

  /** @see FR-session-player-companion-combatants */
  async assertGmCompanionLookup(
    authHeader: string | undefined,
    sessionCode: string,
    playerIds: string[],
  ): Promise<void> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException(
        'Missing or invalid authorization for session access',
      );
    }

    const idsKey = playerIds.map((id) => id.trim()).filter(Boolean).sort().join(',');
    const key = `${authHeader}\0${sessionCode.trim()}\0companion-lookup\0${idsKey}`;
    const pending = this.inflight.get(key);
    if (pending) {
      return pending;
    }

    const run = this.executeCompanionLookup(authHeader, sessionCode, playerIds).finally(
      () => {
        this.inflight.delete(key);
      },
    );
    this.inflight.set(key, run);
    return run;
  }

  private dedupeKey(
    authHeader: string,
    sessionCode: string,
    characterId: string,
    mode: 'roster-read' | 'gm-edit',
    linkedPlayerId?: string,
  ): string {
    return `${authHeader}\0${sessionCode.trim()}\0${characterId.trim()}\0${mode}\0${linkedPlayerId?.trim() ?? ''}`;
  }

  private async postValidate(
    authHeader: string | undefined,
    sessionCode: string,
    characterId: string,
    mode: 'roster-read' | 'gm-edit',
    linkedPlayerId?: string,
  ): Promise<void> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException(
        'Missing or invalid authorization for session access',
      );
    }

    const key = this.dedupeKey(
      authHeader,
      sessionCode,
      characterId,
      mode,
      linkedPlayerId,
    );
    const pending = this.inflight.get(key);
    if (pending) {
      return pending;
    }

    const run = this.executePostValidate(
      authHeader,
      sessionCode,
      characterId,
      mode,
      linkedPlayerId,
    ).finally(() => {
      this.inflight.delete(key);
    });

    this.inflight.set(key, run);
    return run;
  }

  private async executePostValidate(
    authHeader: string,
    sessionCode: string,
    characterId: string,
    mode: 'roster-read' | 'gm-edit',
    linkedPlayerId?: string,
  ): Promise<void> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(sessionCode)}/validate-character-access`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          characterId,
          mode,
          ...(linkedPlayerId?.trim() ? { linkedPlayerId: linkedPlayerId.trim() } : {}),
        }),
      });

      if (res.ok) {
        return;
      }

      this.logger.warn(
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

  private async executeCompanionLookup(
    authHeader: string,
    sessionCode: string,
    playerIds: string[],
  ): Promise<void> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(sessionCode)}/validate-companion-lookup`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ playerIds }),
      });

      if (res.ok) {
        return;
      }

      this.logger.warn(
        `Session companion lookup denied: HTTP ${res.status} in session ${sessionCode}`,
      );
      throw new ForbiddenException('Session companion lookup denied');
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
