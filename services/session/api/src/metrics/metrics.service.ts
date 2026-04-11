import { Injectable, Logger } from '@nestjs/common';
import {
    makeCounterProvider,
    makeHistogramProvider,
    makeGaugeProvider,
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
    name: 'chariot_session_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});

// 2. HISTOGRAM: Temps de réponse des requêtes
export const httpRequestDurationProvider = makeHistogramProvider({
    name: 'chariot_session_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
});

// 3. COMPTEUR: Erreurs applicatives
export const errorsCounterProvider = makeCounterProvider({
    name: 'chariot_session_errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'controller', 'severity'],
});

// 4. COMPTEUR: Sessions créées
export const sessionsCreatedCounterProvider = makeCounterProvider({
    name: 'chariot_sessions_created_total',
    help: 'Total number of sessions created',
    labelNames: ['user_id'],
});

// 5. GAUGE: Sessions actives
export const activeSessionsGaugeProvider = makeGaugeProvider({
    name: 'chariot_active_sessions',
    help: 'Number of currently active sessions',
});

// 6. COMPTEUR: Connexions WebSocket
export const wsConnectionsCounterProvider = makeCounterProvider({
    name: 'chariot_session_ws_connections_total',
    help: 'Total number of WebSocket connections',
    labelNames: ['event'],
});

// 7. GAUGE: Connexions WebSocket actives
export const activeWsConnectionsGaugeProvider = makeGaugeProvider({
    name: 'chariot_session_active_ws_connections',
    help: 'Number of active WebSocket connections',
});

// 8. HISTOGRAM: Temps de requêtes base de données
export const dbQueryDurationProvider = makeHistogramProvider({
    name: 'chariot_session_db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['collection', 'operation'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

// 9. COMPTEUR: Authentifications
export const authAttemptsCounterProvider = makeCounterProvider({
    name: 'chariot_session_auth_attempts_total',
    help: 'Total number of authentication attempts',
    labelNames: ['status'],
});

// 10. GAUGE: Connexions MongoDB
export const mongoConnectionsGaugeProvider = makeGaugeProvider({
    name: 'chariot_session_mongo_connections',
    help: 'Number of active MongoDB connections',
});
