import { Injectable, Logger } from '@nestjs/common';
import {
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor() {
    this.logger.verbose('Media metrics service initialized');
  }
}

export const httpRequestsCounterProvider = makeCounterProvider({
  name: 'chariot_media_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDurationProvider = makeHistogramProvider({
  name: 'chariot_media_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
});

export const uploadsCounterProvider = makeCounterProvider({
  name: 'chariot_media_uploads_total',
  help: 'Total media uploads',
  labelNames: ['type', 'status'],
});

export const presignedUrlCounterProvider = makeCounterProvider({
  name: 'chariot_media_presigned_urls_total',
  help: 'Total presigned URL resolutions (success, missing, external, denied, error)',
  labelNames: ['status'],
});

export const minioOperationDurationProvider = makeHistogramProvider({
  name: 'chariot_media_minio_operation_duration_seconds',
  help: 'MinIO operation duration in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const imageProcessDurationProvider = makeHistogramProvider({
  name: 'chariot_media_image_process_duration_seconds',
  help: 'Sharp avatar processing duration in seconds',
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

export const upstreamDurationProvider = makeHistogramProvider({
  name: 'chariot_media_upstream_duration_seconds',
  help: 'Outbound Adventure / Session call duration in seconds',
  labelNames: ['dependency', 'operation'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

export const storedBytesGaugeProvider = makeGaugeProvider({
  name: 'chariot_media_stored_bytes',
  help: 'Current MinIO occupancy for avatar objects',
  labelNames: ['domain', 'variant'],
});

export const uploadBytesProvider = makeHistogramProvider({
  name: 'chariot_media_upload_bytes',
  help: 'Avatar upload size in bytes (original file vs processed WebP)',
  labelNames: ['domain', 'stage'],
  buckets: [10_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000],
});
