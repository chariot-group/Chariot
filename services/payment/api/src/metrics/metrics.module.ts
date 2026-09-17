import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from '@/metrics/metrics.controller';
import { MetricsService } from '@/metrics/metrics.service';
import { MetricsInterceptor } from '@/metrics/metrics.interceptor';
import {
    httpRequestsCounterProvider,
    httpRequestDurationProvider,
    stripePaymentsCounterProvider,
    stripeWebhooksCounterProvider,
    checkoutsCounterProvider,
    tokenCreditsCounterProvider,
    stripeOperationDurationProvider,
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
                service: 'payment',
            },
        }),
    ],
    controllers: [MetricsController],
    providers: [
        MetricsService,
        MetricsInterceptor,
        httpRequestsCounterProvider,
        httpRequestDurationProvider,
        stripePaymentsCounterProvider,
        stripeWebhooksCounterProvider,
        checkoutsCounterProvider,
        tokenCreditsCounterProvider,
        stripeOperationDurationProvider,
    ],
    exports: [
        MetricsService,
        MetricsInterceptor,
        httpRequestsCounterProvider,
        httpRequestDurationProvider,
        stripePaymentsCounterProvider,
        stripeWebhooksCounterProvider,
        checkoutsCounterProvider,
        tokenCreditsCounterProvider,
        stripeOperationDurationProvider,
    ],
})
export class MetricsModule { }
