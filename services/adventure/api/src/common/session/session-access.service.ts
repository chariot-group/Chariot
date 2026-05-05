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
    await this.postValidate(
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
      throw new ServiceUnavailableException('Could not validate session access');
    }
  }
}
