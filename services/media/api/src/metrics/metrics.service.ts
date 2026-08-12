import { Injectable, Logger } from '@nestjs/common';
import {
  makeCounterProvider,
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

export const errorsCounterProvider = makeCounterProvider({
  name: 'chariot_media_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'controller', 'severity'],
});

export const uploadsCounterProvider = makeCounterProvider({
  name: 'chariot_media_uploads_total',
  help: 'Total media uploads',
  labelNames: ['type', 'status'],
});

export const presignedUrlCounterProvider = makeCounterProvider({
  name: 'chariot_media_presigned_urls_total',
  help: 'Total presigned URL generations',
  labelNames: ['status'],
});

export const minioOperationDurationProvider = makeHistogramProvider({
  name: 'chariot_media_minio_operation_duration_seconds',
  help: 'MinIO operation duration in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});
