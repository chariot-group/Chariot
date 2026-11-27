/**
 * Tags des scénarios boutique, partagés par `playwright.config.ts` (planification) et les fixtures.
 */

/** Test qui attend un paiement confirmé par le webhook Stripe (crédit de tokens, consommation d'une réduction). */
export const WEBHOOK = "@webhook";

/** Sous-ensemble boutique joué sur toutes les cibles ; le reste ne tourne que sur `FULL_MATRIX_PROJECT`. */
export const SMOKE = "@smoke";

/**
 * Seule cible qui joue la matrice boutique complète : × 5 cibles, elle multiplierait
 * les appels à l'API de test Stripe sans couvrir davantage de comportement.
 */
export const FULL_MATRIX_PROJECT = "desktop-chrome";

/** Scénarios boutique hors `@smoke` (le titre filtré contient le chemin du fichier et les tags). */
export const SHOP_FULL_MATRIX_ONLY = new RegExp(`^(?=.*boutique/)(?!.*${SMOKE})`);

/** Tests `@webhook`, exclus quand aucun `stripe listen` ne relaie les webhooks. */
export const WEBHOOK_ONLY = new RegExp(WEBHOOK);
