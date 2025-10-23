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
    this.logger.log('Metrics service initialized');
  }
}

/**
 * Providers de métriques personnalisées
 * À ajouter dans le module MetricsModule
 */

// 1. COMPTEUR: Requêtes HTTP totales
export const httpRequestsCounterProvider = makeCounterProvider({
  name: 'chariot_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// 2. HISTOGRAM: Temps de réponse des requêtes
export const httpRequestDurationProvider = makeHistogramProvider({
  name: 'chariot_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5], // Buckets en secondes
});

// 3. COMPTEUR: Erreurs applicatives
export const errorsCounterProvider = makeCounterProvider({
  name: 'chariot_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'controller', 'severity'],
});

// 4. GAUGE: Nombre d'utilisateurs actifs
export const activeUsersGaugeProvider = makeGaugeProvider({
  name: 'chariot_active_users',
  help: 'Number of currently active users',
});

// 5. COMPTEUR: Campagnes créées
export const campaignsCreatedCounterProvider = makeCounterProvider({
  name: 'chariot_campaigns_created_total',
  help: 'Total number of campaigns created',
  labelNames: ['user_id'],
});

// 6. GAUGE: Total des campagnes actives
export const activeCampaignsGaugeProvider = makeGaugeProvider({
  name: 'chariot_active_campaigns',
  help: 'Number of active campaigns',
});

// 7. COMPTEUR: Personnages créés
export const charactersCreatedCounterProvider = makeCounterProvider({
  name: 'chariot_characters_created_total',
  help: 'Total number of characters created',
  labelNames: ['user_id'],
});

// 8. COMPTEUR: Groupes créés
export const groupsCreatedCounterProvider = makeCounterProvider({
  name: 'chariot_groups_created_total',
  help: 'Total number of groups created',
  labelNames: ['campaign_id'],
});

// 9. COMPTEUR: Authentifications
export const authAttemptsCounterProvider = makeCounterProvider({
  name: 'chariot_auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['status'], // 'success' ou 'failure'
});

// 10. HISTOGRAM: Temps de requêtes base de données
export const dbQueryDurationProvider = makeHistogramProvider({
  name: 'chariot_db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['collection', 'operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

// 11. COMPTEUR: Emails envoyés
export const emailsSentCounterProvider = makeCounterProvider({
  name: 'chariot_emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['type', 'status'], // type: 'welcome', 'reset-password', etc.
});

// 12. COMPTEUR: Paiements Stripe
export const stripePaymentsCounterProvider = makeCounterProvider({
  name: 'chariot_stripe_payments_total',
  help: 'Total number of Stripe payments',
  labelNames: ['status'], // 'success', 'failed', 'pending'
});

// 13. GAUGE: Connexions MongoDB
export const mongoConnectionsGaugeProvider = makeGaugeProvider({
  name: 'chariot_mongo_connections',
  help: 'Number of active MongoDB connections',
});
