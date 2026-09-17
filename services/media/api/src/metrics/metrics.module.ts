import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from '@/metrics/metrics.controller';
import { MetricsService } from '@/metrics/metrics.service';
import { MetricsInterceptor } from '@/metrics/metrics.interceptor';
import { UpstreamTimerService } from '@/metrics/upstream-timer';
import { MEDIA_UPSTREAM_TIMER } from '@/metrics/upstream-timer.token';
import {
  httpRequestsCounterProvider,
  httpRequestDurationProvider,
  uploadsCounterProvider,
  presignedUrlCounterProvider,
  minioOperationDurationProvider,
  imageProcessDurationProvider,
  upstreamDurationProvider,
  storedBytesGaugeProvider,
  uploadBytesProvider,
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
    uploadsCounterProvider,
    presignedUrlCounterProvider,
    minioOperationDurationProvider,
    imageProcessDurationProvider,
    upstreamDurationProvider,
    storedBytesGaugeProvider,
    uploadBytesProvider,
    UpstreamTimerService,
    {
      provide: MEDIA_UPSTREAM_TIMER,
      useExisting: UpstreamTimerService,
    },
  ],
  exports: [
    MetricsService,
    MetricsInterceptor,
    httpRequestsCounterProvider,
    httpRequestDurationProvider,
    uploadsCounterProvider,
    presignedUrlCounterProvider,
    minioOperationDurationProvider,
    imageProcessDurationProvider,
    upstreamDurationProvider,
    storedBytesGaugeProvider,
    uploadBytesProvider,
    UpstreamTimerService,
    MEDIA_UPSTREAM_TIMER,
  ],
})
export class MetricsModule {}
