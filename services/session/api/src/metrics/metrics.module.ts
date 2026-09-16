import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from '@/metrics/metrics.controller';
import { MetricsService } from '@/metrics/metrics.service';
import { MetricsInterceptor } from '@/metrics/metrics.interceptor';
import { SessionLiveMetrics } from '@/metrics/session-live.metrics';
import {
    httpRequestsCounterProvider,
    httpRequestDurationProvider,
    sessionOpenGaugeProvider,
    sessionParticipantsGaugeProvider,
    activeWsConnectionsGaugeProvider,
    sessionLifecycleCounterProvider,
    wsConnectionsCounterProvider,
} from '@/metrics/metrics.service';

const liveMetricProviders = [
    sessionOpenGaugeProvider,
    sessionParticipantsGaugeProvider,
    activeWsConnectionsGaugeProvider,
    sessionLifecycleCounterProvider,
    wsConnectionsCounterProvider,
];

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
                service: 'session',
            },
        }),
    ],
    controllers: [MetricsController],
    providers: [
        MetricsService,
        MetricsInterceptor,
        SessionLiveMetrics,
        httpRequestsCounterProvider,
        httpRequestDurationProvider,
        ...liveMetricProviders,
    ],
    exports: [
        MetricsService,
        MetricsInterceptor,
        SessionLiveMetrics,
        httpRequestsCounterProvider,
        httpRequestDurationProvider,
        ...liveMetricProviders,
    ],
})
export class MetricsModule {}
