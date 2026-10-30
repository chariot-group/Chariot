import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  HttpException,
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
  ): Promise<void> {
    await this.postValidate(
      authHeader,
      sessionCode,
      characterId,
      'roster-read',
    );
  }

  async assertGmEdit(
    authHeader: string | undefined,
    sessionCode: string,
    characterId: string,
  ): Promise<void> {
    await this.postValidate(authHeader, sessionCode, characterId, 'gm-edit');
  }

  /**
   * Vérifie que l'appelant et targetUserId sont tous deux participants (ou MJ)
   * de la session identifiée par sessionCode, avant d'exposer le profil public
   * (nom, avatar) de targetUserId.
   * @see FR-user-public-profile-read-access
   */
  async assertUserCoParticipant(
    authHeader: string | undefined,
    sessionCode: string,
    targetUserId: string,
  ): Promise<void> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException(
        'Missing or invalid authorization for session access',
      );
    }

    const code = sessionCode.trim();
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(code)}/validate-co-participant`;

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

      if (res.status === 404) {
        throw new NotFoundException('Session not found');
      }

      if (res.status >= 500) {
        this.logger.error(
          `Session service error: HTTP ${res.status} while validating co-participation in session ${code}`,
        );
        throw new ServiceUnavailableException(
          'Could not validate session access',
        );
      }

      this.logger.warn(
        `Co-participation denied: HTTP ${res.status} for target user ${targetUserId} in session ${code}`,
      );
      throw new ForbiddenException('Session co-participation access denied');
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      const cause = (
        err as Error & { cause?: { code?: string; message?: string } }
      ).cause;
      const message = `Session service unreachable at ${url}: ${(err as Error).message}${cause ? ` (${cause.code ?? cause.message})` : ''}`;
      this.logger.error(message, (err as Error).stack);
      throw new ServiceUnavailableException(
        'Could not validate session access',
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

  private async postValidate(
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

    const run = this.executePostValidate(
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

  private async executePostValidate(
    authHeader: string,
    sessionCode: string,
    characterId: string,
    mode: 'roster-read' | 'gm-edit',
  ): Promise<void> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(sessionCode)}/validate-character-access`;

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

      this.logger.warn(
        `Session access denied: HTTP ${res.status} for ${mode} character ${characterId}`,
      );
      throw new ForbiddenException('Session character access denied');
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      const cause = (
        err as Error & { cause?: { code?: string; message?: string } }
      ).cause;
      const message = `Session service unreachable at ${url}: ${(err as Error).message}${cause ? ` (${cause.code ?? cause.message})` : ''}`;
      this.logger.error(message, (err as Error).stack);
      throw new ServiceUnavailableException(
        'Could not validate session access',
      );
    }
  }
}
