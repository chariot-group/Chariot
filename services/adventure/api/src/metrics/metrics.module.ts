import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from '@/metrics/metrics.controller';
import { MetricsService } from '@/metrics/metrics.service';
import { MetricsInterceptor } from '@/metrics/metrics.interceptor';
import {
  httpRequestsCounterProvider,
  httpRequestDurationProvider,
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
        service: 'adventure',
      },
    }),
  ],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    MetricsInterceptor,
    httpRequestsCounterProvider,
    httpRequestDurationProvider,
  ],
  exports: [
    MetricsService,
    MetricsInterceptor,
    httpRequestsCounterProvider,
    httpRequestDurationProvider,
  ],
})
export class MetricsModule {}
