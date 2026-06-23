export const MEDIA_BUCKET = 'chariot-media';

export const MEDIA_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const MEDIA_MAIN_MAX_PX = 512;
export const MEDIA_THUMB_PX = 96;

export const MEDIA_WEBP_QUALITY = 85;

export const MEDIA_PRESIGNED_TTL_SECONDS = 30 * 60;

export const MEDIA_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
  'image/heic',
  'image/heif',
]);
