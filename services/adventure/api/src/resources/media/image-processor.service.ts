import {
  BadRequestException,
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import sharp from 'sharp';
import {
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_MAIN_MAX_PX,
  MEDIA_MAX_UPLOAD_BYTES,
  MEDIA_THUMB_PX,
  MEDIA_WEBP_QUALITY,
} from '@/resources/media/media.constants';

export type ProcessedAvatarImages = {
  main: Buffer;
  thumb: Buffer;
  contentType: 'image/webp';
};

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  async processAvatarUpload(
    file: Express.Multer.File,
  ): Promise<ProcessedAvatarImages> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No image file provided');
    }

    if (file.size > MEDIA_MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException(
        `Image exceeds maximum size of ${MEDIA_MAX_UPLOAD_BYTES} bytes`,
      );
    }

    if (!MEDIA_ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported image format. Use JPEG, PNG, or WebP.',
      );
    }

    try {
      const main = await sharp(file.buffer, { failOn: 'none' })
        .rotate()
        .resize(MEDIA_MAIN_MAX_PX, MEDIA_MAIN_MAX_PX, {
          fit: 'cover',
          position: 'centre',
        })
        .webp({ quality: MEDIA_WEBP_QUALITY, effort: 4 })
        .toBuffer();

      const thumb = await sharp(file.buffer, { failOn: 'none' })
        .rotate()
        .resize(MEDIA_THUMB_PX, MEDIA_THUMB_PX, {
          fit: 'cover',
          position: 'centre',
        })
        .webp({ quality: MEDIA_WEBP_QUALITY, effort: 3 })
        .toBuffer();

      return {
        main,
        thumb,
        contentType: 'image/webp',
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown image processing error';
      this.logger.warn(
        `Avatar upload rejected: ${message} (mimetype=${file.mimetype}, size=${file.size}, buffer=${file.buffer.length})`,
      );
      throw new BadRequestException('Invalid or corrupted image file');
    }
  }
}
