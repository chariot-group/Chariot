import { Injectable, Logger } from '@nestjs/common';
import {
    makeCounterProvider,
    makeHistogramProvider,
    makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
    private readonly logger = new Logger(MetricsService.name);

    constructor() {
        this.logger.verbose('Metrics service initialized');
    }
}

export const httpRequestsCounterProvider = makeCounterProvider({
    name: 'chariot_session_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDurationProvider = makeHistogramProvider({
    name: 'chariot_session_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
});

export const sessionOpenGaugeProvider = makeGaugeProvider({
    name: 'chariot_session_open',
    help: 'Open sessions by status (activated lobby, launched table)',
    labelNames: ['status'],
});

export const sessionParticipantsGaugeProvider = makeGaugeProvider({
    name: 'chariot_session_participants',
    help: 'Participants on open sessions by presence status',
    labelNames: ['status'],
});

export const activeWsConnectionsGaugeProvider = makeGaugeProvider({
    name: 'chariot_session_active_ws_connections',
    help: 'Number of authenticated WebSocket connections',
});

export const sessionLifecycleCounterProvider = makeCounterProvider({
    name: 'chariot_session_lifecycle_total',
    help: 'Session lifecycle events',
    labelNames: ['action'],
});

export const wsConnectionsCounterProvider = makeCounterProvider({
    name: 'chariot_session_ws_connections_total',
    help: 'WebSocket connect / disconnect / reject events',
    labelNames: ['event'],
});
