import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';
import { ImageProcessorService } from '@/resources/media/image-processor.service';
import { MediaAccessService } from '@/resources/media/media-access.service';
import { MinioService } from '@/resources/media/minio.service';
import {
  PresignedReadItemDto,
  PresignedUrlResultDto,
} from '@/resources/media/dto/presigned-read.dto';
import {
  characterAvatarMainKey,
  characterAvatarThumbKey,
  isExternalMediaUrl,
  isMediaObjectKey,
  mediaStorageLabels,
  presignedCacheKey,
  resolveMediaObjectKey,
  resolveLegacyAvatarKeysToDelete,
  userAvatarMainKey,
  userAvatarThumbKey,
} from '@/resources/media/media.utils';

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);
  private readonly adventureBaseUrl: string;
  private readonly internalSecret: string;

  constructor(
    private readonly minioService: MinioService,
    private readonly imageProcessorService: ImageProcessorService,
    private readonly mediaAccessService: MediaAccessService,
    private readonly configService: ConfigService,
    @InjectMetric('chariot_media_uploads_total')
    private readonly uploadsCounter: Counter<string>,
    @InjectMetric('chariot_media_presigned_urls_total')
    private readonly presignedCounter: Counter<string>,
    @InjectMetric('chariot_media_minio_operation_duration_seconds')
    private readonly minioDuration: Histogram<string>,
    @InjectMetric('chariot_media_image_process_duration_seconds')
    private readonly imageProcessDuration: Histogram<string>,
    @InjectMetric('chariot_media_upstream_duration_seconds')
    private readonly upstreamDuration: Histogram<string>,
    @InjectMetric('chariot_media_stored_bytes')
    private readonly storedBytes: Gauge<string>,
    @InjectMetric('chariot_media_upload_bytes')
    private readonly uploadBytes: Histogram<string>,
  ) {
    this.adventureBaseUrl = (
      this.configService.get<string>('ADVENTURE_INTERNAL_URL') ??
      'http://localhost:9000'
    ).replace(/\/$/, '');

    this.internalSecret =
      this.configService.get<string>('INTERNAL_SERVICE_SECRET') ?? '';
  }

  async onModuleInit(): Promise<void> {
    await this.refreshStoredBytes();
  }

  async uploadCharacterAvatar(
    characterId: string,
    file: Express.Multer.File,
    requesterId: string,
    authHeader: string | undefined,
    sessionCode?: string,
  ): Promise<{ avatar: string }> {
    this.ensureMinioReady();

    const character = await this.mediaAccessService.assertCharacterWriteAccess(
      characterId,
      requesterId,
      authHeader,
      sessionCode,
    );

    const processed = await this.withImageTiming(() =>
      this.imageProcessorService.processAvatarUpload(file),
    );

    const mainKey = characterAvatarMainKey(characterId);
    const thumbKey = characterAvatarThumbKey(characterId);

    await this.deleteLegacyAvatarObjects(character.avatar, mainKey, thumbKey);

    await this.putAvatarObjects(mainKey, thumbKey, processed);
    this.observeUploadBytes('character', file.size, processed);

    await this.updateCharacterAvatar(characterId, mainKey);

    this.mediaAccessService.refreshCharacterOwnerCache(characterId, {
      createdBy: character.createdBy,
      avatar: mainKey,
      kind: character.kind,
    });

    this.uploadsCounter.inc({ type: 'character_avatar', status: 'success' });
    this.logger.log(`Character avatar uploaded for ${characterId}`);
    return { avatar: mainKey };
  }

  async deleteCharacterAvatar(
    characterId: string,
    requesterId: string,
    authHeader: string | undefined,
    sessionCode?: string,
  ): Promise<{ avatar: string }> {
    this.ensureMinioReady();

    const character = await this.mediaAccessService.assertCharacterWriteAccess(
      characterId,
      requesterId,
      authHeader,
      sessionCode,
    );

    await this.deleteStoredCharacterObjects(character.avatar, characterId);
    await this.updateCharacterAvatar(characterId, '');

    this.logger.log(`Character avatar removed for ${characterId}`);

    this.mediaAccessService.refreshCharacterOwnerCache(characterId, {
      createdBy: character.createdBy,
      avatar: '',
      kind: character.kind,
    });

    return { avatar: '' };
  }

  async uploadUserAvatar(
    keycloakId: string,
    file: Express.Multer.File,
    requesterId: string,
  ): Promise<{ avatar: string }> {
    this.ensureMinioReady();
    this.mediaAccessService.assertUserSelfAccess(keycloakId, requesterId);

    const processed = await this.withImageTiming(() =>
      this.imageProcessorService.processAvatarUpload(file),
    );

    const mainKey = userAvatarMainKey(keycloakId);
    const thumbKey = userAvatarThumbKey(keycloakId);

    const previousAvatar = await this.fetchUserAvatar(keycloakId);

    await this.deleteLegacyAvatarObjects(previousAvatar, mainKey, thumbKey);

    await this.putAvatarObjects(mainKey, thumbKey, processed);
    this.observeUploadBytes('user', file.size, processed);

    await this.updateUserAvatar(keycloakId, mainKey);

    this.uploadsCounter.inc({ type: 'user_avatar', status: 'success' });
    this.logger.log(`User avatar uploaded for ${keycloakId}`);
    return { avatar: mainKey };
  }

  async deleteUserAvatar(
    keycloakId: string,
    requesterId: string,
  ): Promise<{ avatar: string }> {
    this.ensureMinioReady();
    this.mediaAccessService.assertUserSelfAccess(keycloakId, requesterId);

    const previousAvatar = await this.fetchUserAvatar(keycloakId);

    await this.deleteStoredUserObjects(previousAvatar, keycloakId);
    await this.updateUserAvatar(keycloakId, '');

    this.logger.log(`User avatar removed for ${keycloakId}`);
    return { avatar: '' };
  }

  async resolvePresignedReads(
    requests: PresignedReadItemDto[],
    requesterId: string,
    authHeader: string | undefined,
    sessionCode?: string,
  ): Promise<Record<string, PresignedUrlResultDto>> {
    const results: Record<string, PresignedUrlResultDto> = {};

    await Promise.all(
      requests.map(async (item) => {
        const cacheKey = presignedCacheKey(item.scope, item.id, item.variant);
        try {
          results[cacheKey] = await this.resolveSinglePresignedRead(
            item,
            requesterId,
            authHeader,
            sessionCode,
          );
        } catch (error) {
          if (error instanceof ForbiddenException) {
            this.presignedCounter.inc({ status: 'denied' });
            results[cacheKey] = {
              url: null,
              expiresAt: null,
              source: 'missing',
            };
            return;
          }
          if (error instanceof BadRequestException) {
            this.presignedCounter.inc({ status: 'missing' });
            results[cacheKey] = {
              url: null,
              expiresAt: null,
              source: 'missing',
            };
            return;
          }
          throw error;
        }
      }),
    );

    const sources = { presigned: 0, missing: 0, external: 0 };
    for (const result of Object.values(results)) {
      sources[result.source]++;
    }
    this.logger.debug(
      `Presigned reads: ${requests.length} requested, ${sources.presigned} signed, ${sources.missing} missing, ${sources.external} external`,
    );

    return results;
  }

  private async resolveSinglePresignedRead(
    item: PresignedReadItemDto,
    requesterId: string,
    authHeader: string | undefined,
    sessionCode?: string,
  ): Promise<PresignedUrlResultDto> {
    if (item.scope === 'character') {
      return this.resolveCharacterPresignedRead(
        item,
        requesterId,
        authHeader,
        sessionCode,
      );
    }

    return this.resolveUserPresignedRead(
      item,
      requesterId,
      authHeader,
      sessionCode,
    );
  }

  private async resolveCharacterPresignedRead(
    item: PresignedReadItemDto,
    requesterId: string,
    authHeader: string | undefined,
    sessionCode?: string,
  ): Promise<PresignedUrlResultDto> {
    const character = await this.mediaAccessService.assertCharacterReadAccess(
      item.id,
      requesterId,
      authHeader,
      sessionCode,
    );

    return this.resolveStoredValuePresigned(
      character.avatar,
      item.variant,
      'character',
      item.id,
    );
  }

  private async resolveUserPresignedRead(
    item: PresignedReadItemDto,
    requesterId: string,
    authHeader: string | undefined,
    sessionCode?: string,
  ): Promise<PresignedUrlResultDto> {
    if (!requesterId) {
      throw new ForbiddenException('Authentication required');
    }

    await this.mediaAccessService.assertUserAvatarReadAccess(
      item.id,
      requesterId,
      authHeader,
      sessionCode,
    );

    const stored = await this.fetchUserAvatar(item.id);

    return this.resolveStoredValuePresigned(
      stored,
      item.variant,
      'user',
      item.id,
    );
  }

  private async resolveStoredValuePresigned(
    storedValue: string | null | undefined,
    variant: 'main' | 'thumb',
    scope: 'character' | 'user',
    entityId: string,
  ): Promise<PresignedUrlResultDto> {
    if (!storedValue?.trim()) {
      this.presignedCounter.inc({ status: 'missing' });
      return { url: null, expiresAt: null, source: 'missing' };
    }

    const trimmed = storedValue.trim();

    if (isExternalMediaUrl(trimmed)) {
      this.presignedCounter.inc({ status: 'external' });
      return { url: trimmed, expiresAt: null, source: 'external' };
    }

    if (!this.minioService.isEnabled()) {
      throw new ServiceUnavailableException('Media storage is not configured');
    }

    const objectKey = resolveMediaObjectKey(trimmed, variant, scope, entityId);

    if (!objectKey) {
      this.presignedCounter.inc({ status: 'missing' });
      return { url: null, expiresAt: null, source: 'missing' };
    }

    try {
      const presigned = await this.withMinioTiming('presign_get', () =>
        this.minioService.createPresignedGetUrl(objectKey),
      );
      this.presignedCounter.inc({ status: 'success' });
      return {
        url: presigned.url,
        expiresAt: presigned.expiresAt,
        source: 'presigned',
      };
    } catch (error) {
      this.presignedCounter.inc({ status: 'error' });
      this.logger.warn(
        `Presigned URL failed for ${objectKey}: ${(error as Error).message}`,
      );
      return { url: null, expiresAt: null, source: 'missing' };
    }
  }

  private async deleteStoredCharacterObjects(
    storedValue: string | null | undefined,
    characterId: string,
  ): Promise<void> {
    if (isExternalMediaUrl(storedValue)) {
      return;
    }

    if (!storedValue?.trim() && !isMediaObjectKey(storedValue)) {
      return;
    }

    await this.deleteKeysAndAccount([
      characterAvatarMainKey(characterId),
      characterAvatarThumbKey(characterId),
    ]);
  }

  private async deleteLegacyAvatarObjects(
    storedValue: string | null | undefined,
    canonicalMain: string,
    canonicalThumb: string,
  ): Promise<void> {
    const keys = resolveLegacyAvatarKeysToDelete(
      storedValue,
      canonicalMain,
      canonicalThumb,
    );
    if (keys.length > 0) {
      await this.deleteKeysAndAccount(keys);
    }
  }

  private async deleteStoredUserObjects(
    storedValue: string | null | undefined,
    keycloakId: string,
  ): Promise<void> {
    if (isExternalMediaUrl(storedValue)) {
      return;
    }

    if (!storedValue?.trim() && !isMediaObjectKey(storedValue)) {
      return;
    }

    await this.deleteKeysAndAccount([
      userAvatarMainKey(keycloakId),
      userAvatarThumbKey(keycloakId),
    ]);
  }

  private async fetchUserAvatar(keycloakId: string): Promise<string | null> {
    const url = `${this.adventureBaseUrl}/user/internal/${encodeURIComponent(keycloakId)}/avatar`;

    try {
      const res = await this.timedFetch('adventure', 'fetch_user_avatar', url, {
        method: 'GET',
        headers: { 'x-internal-service-secret': this.internalSecret },
      });

      if (!res.ok) {
        this.logger.warn(
          `Could not fetch user avatar from adventure: HTTP ${res.status}`,
        );
        return null;
      }

      const body = (await res.json()) as { avatar: string | null };
      return body.avatar ?? null;
    } catch (err) {
      this.logger.error(
        `Adventure service unreachable for user avatar fetch: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return null;
    }
  }

  private async updateCharacterAvatar(
    characterId: string,
    avatar: string,
  ): Promise<void> {
    const url = `${this.adventureBaseUrl}/characters/internal/${encodeURIComponent(characterId)}/avatar`;

    try {
      const res = await this.timedFetch(
        'adventure',
        'patch_character_avatar',
        url,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-service-secret': this.internalSecret,
          },
          body: JSON.stringify({ avatar }),
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.error(
          `Adventure service returned ${res.status} for character avatar update: ${text}`,
        );
        throw new ServiceUnavailableException(
          'Could not persist character avatar',
        );
      }
    } catch (err) {
      if (err instanceof ServiceUnavailableException) {
        throw err;
      }
      const message = `Adventure service unreachable: ${(err as Error).message}`;
      this.logger.error(message, (err as Error).stack);
      throw new ServiceUnavailableException(
        'Could not persist character avatar',
      );
    }
  }

  private async updateUserAvatar(
    keycloakId: string,
    avatar: string,
  ): Promise<void> {
    const url = `${this.adventureBaseUrl}/user/internal/${encodeURIComponent(keycloakId)}/avatar`;

    try {
      const res = await this.timedFetch('adventure', 'patch_user_avatar', url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-service-secret': this.internalSecret,
        },
        body: JSON.stringify({ avatar }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.error(
          `Adventure service returned ${res.status} for user avatar update: ${text}`,
        );
        throw new ServiceUnavailableException('Could not persist user avatar');
      }
    } catch (err) {
      if (err instanceof ServiceUnavailableException) {
        throw err;
      }
      const message = `Adventure service unreachable: ${(err as Error).message}`;
      this.logger.error(message, (err as Error).stack);
      throw new ServiceUnavailableException('Could not persist user avatar');
    }
  }

  private async putAvatarObjects(
    mainKey: string,
    thumbKey: string,
    processed: { main: Buffer; thumb: Buffer; contentType: string },
  ): Promise<void> {
    await this.putObjectAndAccount(
      mainKey,
      processed.main,
      processed.contentType,
    );
    await this.putObjectAndAccount(
      thumbKey,
      processed.thumb,
      processed.contentType,
    );
  }

  private async putObjectAndAccount(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    const previous = await this.minioService.headObjectSize(key);
    await this.withMinioTiming('put', () =>
      this.minioService.putObject(key, body, contentType),
    );
    this.adjustStoredBytes(key, body.length - previous);
  }

  private async deleteKeysAndAccount(keys: string[]): Promise<void> {
    const unique = [...new Set(keys.filter(Boolean))];
    await this.withMinioTiming('delete', async () => {
      for (const key of unique) {
        const size = await this.minioService.headObjectSize(key);
        await this.minioService.deleteObject(key);
        if (size > 0) {
          this.adjustStoredBytes(key, -size);
        }
      }
    });
  }

  private observeUploadBytes(
    domain: 'character' | 'user',
    originalBytes: number,
    processed: { main: Buffer; thumb: Buffer },
  ): void {
    this.uploadBytes.observe({ domain, stage: 'original' }, originalBytes);
    this.uploadBytes.observe(
      { domain, stage: 'processed' },
      processed.main.length + processed.thumb.length,
    );
  }

  private adjustStoredBytes(key: string, delta: number): void {
    if (delta === 0) {
      return;
    }
    const { domain, variant } = mediaStorageLabels(key);
    this.storedBytes.inc({ domain, variant }, delta);
  }

  private async refreshStoredBytes(): Promise<void> {
    if (!this.minioService.isEnabled()) {
      return;
    }

    try {
      const objects = [
        ...(await this.minioService.listObjectSizes('avatars/characters/')),
        ...(await this.minioService.listObjectSizes('avatars/users/')),
      ];
      const totals = new Map<string, number>();
      for (const { key, size } of objects) {
        const labels = mediaStorageLabels(key);
        const mapKey = `${labels.domain}|${labels.variant}`;
        totals.set(mapKey, (totals.get(mapKey) ?? 0) + size);
      }

      for (const domain of ['character', 'user'] as const) {
        for (const variant of ['main', 'thumb'] as const) {
          this.storedBytes.set(
            { domain, variant },
            totals.get(`${domain}|${variant}`) ?? 0,
          );
        }
      }
    } catch (error) {
      this.logger.warn(
        `Could not reconcile MinIO occupancy: ${(error as Error).message}`,
      );
    }
  }

  private async withImageTiming<T>(fn: () => Promise<T>): Promise<T> {
    const end = this.imageProcessDuration.startTimer();
    try {
      return await fn();
    } finally {
      end();
    }
  }

  private async timedFetch(
    dependency: 'adventure' | 'session',
    operation: string,
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    const end = this.upstreamDuration.startTimer({ dependency, operation });
    try {
      return await fetch(url, init);
    } finally {
      end();
    }
  }

  private async withMinioTiming<T>(
    operation: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const end = this.minioDuration.startTimer({ operation });
    try {
      return await fn();
    } finally {
      end();
    }
  }

  private ensureMinioReady(): void {
    if (!this.minioService.isEnabled()) {
      throw new ServiceUnavailableException('Media storage is not configured');
    }
  }
}
