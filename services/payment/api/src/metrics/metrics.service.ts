import { Injectable, Logger } from '@nestjs/common';
import {
    makeCounterProvider,
    makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
    private readonly logger = new Logger(MetricsService.name);
    private readonly SERVICE_NAME = MetricsService.name;

    constructor() {
        this.logger.verbose('Metrics service initialized', this.SERVICE_NAME);
    }
}

// 1. COMPTEUR: Requêtes HTTP totales
export const httpRequestsCounterProvider = makeCounterProvider({
    name: 'chariot_payment_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});

// 2. HISTOGRAM: Temps de réponse des requêtes
export const httpRequestDurationProvider = makeHistogramProvider({
    name: 'chariot_payment_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
});

// 3. COMPTEUR: Erreurs applicatives
export const errorsCounterProvider = makeCounterProvider({
    name: 'chariot_payment_errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'controller', 'severity'],
});

// 4. COMPTEUR: Paiements créés
export const paymentsCreatedCounterProvider = makeCounterProvider({
    name: 'chariot_payments_created_total',
    help: 'Total number of payments created',
    labelNames: ['status', 'currency'],
});

// 5. COMPTEUR: Utilisations de codes promo
export const promoCodeUsagesCounterProvider = makeCounterProvider({
    name: 'chariot_promo_code_usages_total',
    help: 'Total number of promo code usages',
    labelNames: ['code'],
});

// 6. COMPTEUR: Utilisations de codes d'affiliation
export const affiliationUsagesCounterProvider = makeCounterProvider({
    name: 'chariot_affiliation_usages_total',
    help: 'Total number of affiliation code usages',
    labelNames: ['code'],
});

// 7. HISTOGRAM: Temps de requêtes base de données
export const dbQueryDurationProvider = makeHistogramProvider({
    name: 'chariot_payment_db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['table', 'operation'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

// 8. COMPTEUR: Paiements Stripe
export const stripePaymentsCounterProvider = makeCounterProvider({
    name: 'chariot_stripe_payments_total',
    help: 'Total number of Stripe payments',
    labelNames: ['status'],
});

// 9. COMPTEUR: Webhooks Stripe
export const stripeWebhooksCounterProvider = makeCounterProvider({
    name: 'chariot_stripe_webhooks_total',
    help: 'Total number of Stripe webhooks received',
    labelNames: ['status', 'event_type'],
});
