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
  stripePaymentsCounterProvider,
  mongoConnectionsGaugeProvider,
} from '@/metrics/metrics.service';

@Module({
  imports: [
    PrometheusModule.register({
      // Configuration du endpoint /metrics
      path: '/metrics',
      // Métriques par défaut (CPU, mémoire, etc.)
      defaultMetrics: {
        enabled: true,
        config: {
          // Préfixe pour toutes les métriques par défaut
          prefix: 'chariot_',
        },
      },
      // Labels globaux ajoutés à toutes les métriques
      defaultLabels: {
        app: 'chariot',
        service: 'backend',
      },
    }),
  ],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    MetricsInterceptor, // Ajout de l'intercepteur
    // Providers de métriques personnalisées
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
    stripePaymentsCounterProvider,
    mongoConnectionsGaugeProvider,
  ],
  exports: [
    MetricsService,
    MetricsInterceptor,
    // Export des providers de métriques pour injection dans d'autres modules
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
    stripePaymentsCounterProvider,
    mongoConnectionsGaugeProvider,
  ],
})
export class MetricsModule { }
