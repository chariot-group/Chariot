import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from '@/metrics/metrics.controller';
import { MetricsService } from '@/metrics/metrics.service';
import { MetricsInterceptor } from '@/metrics/metrics.interceptor';
import {
  httpRequestsCounterProvider,
  httpRequestDurationProvider,
  errorsCounterProvider,
  uploadsCounterProvider,
  presignedUrlCounterProvider,
  minioOperationDurationProvider,
} from '@/metrics/metrics.service';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'chariot_',
        },
      },
      defaultLabels: {
        app: 'chariot',
        service: 'media',
      },
    }),
  ],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    MetricsInterceptor,
    httpRequestsCounterProvider,
    httpRequestDurationProvider,
    errorsCounterProvider,
    uploadsCounterProvider,
    presignedUrlCounterProvider,
    minioOperationDurationProvider,
  ],
  exports: [
    MetricsService,
    MetricsInterceptor,
    httpRequestsCounterProvider,
    httpRequestDurationProvider,
    errorsCounterProvider,
    uploadsCounterProvider,
    presignedUrlCounterProvider,
    minioOperationDurationProvider,
  ],
})
export class MetricsModule {}
