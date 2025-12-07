import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from '@/metrics/metrics.controller';
import { MetricsService } from '@/metrics/metrics.service';
import { MetricsInterceptor } from '@/metrics/metrics.interceptor';
import {
  httpRequestsCounterProvider,
  httpRequestDurationProvider,
  errorsCounterProvider,
  activeUsersGaugeProvider,
  campaignsCreatedCounterProvider,
  activeCampaignsGaugeProvider,
  charactersCreatedCounterProvider,
  groupsCreatedCounterProvider,
  authAttemptsCounterProvider,
  dbQueryDurationProvider,
  emailsSentCounterProvider,
  mongoConnectionsGaugeProvider,
} from '@/metrics/metrics.service';

@Module({
  imports: [
    PrometheusModule.register({
      // Configuration du endpoint /metrics
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'chariot_',
        },
      },
      defaultLabels: {
        app: 'chariot',
        service: 'backend',
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
    activeUsersGaugeProvider,
    campaignsCreatedCounterProvider,
    activeCampaignsGaugeProvider,
    charactersCreatedCounterProvider,
    groupsCreatedCounterProvider,
    authAttemptsCounterProvider,
    dbQueryDurationProvider,
    emailsSentCounterProvider,
    mongoConnectionsGaugeProvider,
  ],
  exports: [
    MetricsService,
    MetricsInterceptor,
    httpRequestsCounterProvider,
    httpRequestDurationProvider,
    errorsCounterProvider,
    activeUsersGaugeProvider,
    campaignsCreatedCounterProvider,
    activeCampaignsGaugeProvider,
    charactersCreatedCounterProvider,
    groupsCreatedCounterProvider,
    authAttemptsCounterProvider,
    dbQueryDurationProvider,
    emailsSentCounterProvider,
    mongoConnectionsGaugeProvider,
  ],
})
export class MetricsModule { }
