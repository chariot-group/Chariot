import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Character,
  CharacterDocument,
} from '@/resources/character/core/schemas/character.schema';
import { KeycloakService } from '@/resources/user/keycloak.service';
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
  presignedCacheKey,
  resolveMediaObjectKey,
  resolveLegacyAvatarKeysToDelete,
  userAvatarMainKey,
  userAvatarThumbKey,
} from '@/resources/media/media.utils';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly minioService: MinioService,
    private readonly imageProcessorService: ImageProcessorService,
    private readonly mediaAccessService: MediaAccessService,
    private readonly keycloakService: KeycloakService,
    @InjectModel(Character.name)
    private readonly characterModel: Model<CharacterDocument>,
  ) {}

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

    const processed =
      await this.imageProcessorService.processAvatarUpload(file);

    const mainKey = characterAvatarMainKey(characterId);
    const thumbKey = characterAvatarThumbKey(characterId);

    await this.deleteLegacyAvatarObjects(
      character.avatar,
      mainKey,
      thumbKey,
    );

    await this.minioService.putObject(
      mainKey,
      processed.main,
      processed.contentType,
    );
    await this.minioService.putObject(
      thumbKey,
      processed.thumb,
      processed.contentType,
    );

    character.avatar = mainKey;
    await character.save();

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
    character.avatar = '';
    await character.save();

    return { avatar: '' };
  }

  async uploadUserAvatar(
    keycloakId: string,
    file: Express.Multer.File,
    requesterId: string,
  ): Promise<{ avatar: string }> {
    this.ensureMinioReady();
    this.mediaAccessService.assertUserSelfAccess(keycloakId, requesterId);

    const processed =
      await this.imageProcessorService.processAvatarUpload(file);

    const mainKey = userAvatarMainKey(keycloakId);
    const thumbKey = userAvatarThumbKey(keycloakId);

    const existingUser = await this.keycloakService.getUserById(keycloakId);
    const previousAvatar = existingUser.attributes?.avatar?.[0];

    await this.deleteLegacyAvatarObjects(previousAvatar, mainKey, thumbKey);

    await this.minioService.putObject(
      mainKey,
      processed.main,
      processed.contentType,
    );
    await this.minioService.putObject(
      thumbKey,
      processed.thumb,
      processed.contentType,
    );

    await this.keycloakService.updateUserAttributes(keycloakId, {
      avatar: [mainKey],
    });

    return { avatar: mainKey };
  }

  async deleteUserAvatar(
    keycloakId: string,
    requesterId: string,
  ): Promise<{ avatar: string }> {
    this.ensureMinioReady();
    this.mediaAccessService.assertUserSelfAccess(keycloakId, requesterId);

    const existingUser = await this.keycloakService.getUserById(keycloakId);
    const previousAvatar = existingUser.attributes?.avatar?.[0];

    await this.deleteStoredUserObjects(previousAvatar, keycloakId);

    await this.keycloakService.updateUserAttributes(keycloakId, {
      avatar: [],
    });

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
          if (
            error instanceof ForbiddenException ||
            error instanceof BadRequestException
          ) {
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

    return this.resolveUserPresignedRead(item, requesterId);
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
  ): Promise<PresignedUrlResultDto> {
    if (!requesterId) {
      throw new ForbiddenException('Authentication required');
    }

    const user = await this.keycloakService.getUserById(item.id);
    const stored = user.attributes?.avatar?.[0] ?? '';

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
      return { url: null, expiresAt: null, source: 'missing' };
    }

    const trimmed = storedValue.trim();

    if (isExternalMediaUrl(trimmed)) {
      return {
        url: trimmed,
        expiresAt: null,
        source: 'external',
      };
    }

    if (!this.minioService.isEnabled()) {
      throw new ServiceUnavailableException('Media storage is not configured');
    }

    const objectKey = resolveMediaObjectKey(
      trimmed,
      variant,
      scope,
      entityId,
    );

    if (!objectKey) {
      return { url: null, expiresAt: null, source: 'missing' };
    }

    try {
      const presigned = await this.minioService.createPresignedGetUrl(objectKey);
      return {
        url: presigned.url,
        expiresAt: presigned.expiresAt,
        source: 'presigned',
      };
    } catch (error) {
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

    await this.minioService.deleteObjects([
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
      await this.minioService.deleteObjects(keys);
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

    await this.minioService.deleteObjects([
      userAvatarMainKey(keycloakId),
      userAvatarThumbKey(keycloakId),
    ]);
  }

  private ensureMinioReady(): void {
    if (!this.minioService.isEnabled()) {
      throw new ServiceUnavailableException('Media storage is not configured');
    }
  }
}
