import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from '@/metrics/metrics.controller';
import { MetricsService } from '@/metrics/metrics.service';
import { MetricsInterceptor } from '@/metrics/metrics.interceptor';
import {
    httpRequestsCounterProvider,
    httpRequestDurationProvider,
    errorsCounterProvider,
    paymentsCreatedCounterProvider,
    promoCodeUsagesCounterProvider,
    affiliationUsagesCounterProvider,
    dbQueryDurationProvider,
    stripePaymentsCounterProvider,
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
        errorsCounterProvider,
        paymentsCreatedCounterProvider,
        promoCodeUsagesCounterProvider,
        affiliationUsagesCounterProvider,
        dbQueryDurationProvider,
        stripePaymentsCounterProvider,
    ],
    exports: [
        MetricsService,
        MetricsInterceptor,
        httpRequestsCounterProvider,
        httpRequestDurationProvider,
        errorsCounterProvider,
        paymentsCreatedCounterProvider,
        promoCodeUsagesCounterProvider,
        affiliationUsagesCounterProvider,
        dbQueryDurationProvider,
        stripePaymentsCounterProvider,
    ],
})
export class MetricsModule { }
