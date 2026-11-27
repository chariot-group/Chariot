/**
 * Tags des scénarios boutique et de l'assistant de création, partagés par `playwright.config.ts` (planification)
 * et les fixtures.
 */

/** Test qui attend un paiement confirmé par le webhook Stripe (crédit de tokens, consommation d'une réduction). */
export const WEBHOOK = "@webhook";

/**
 * Sous-ensemble joué sur toutes les cibles (boutique, assistant de création) ; le reste de ces dossiers ne tourne
 * que sur `FULL_MATRIX_PROJECT`.
 */
export const SMOKE = "@smoke";

/**
 * Seule cible qui joue la matrice complète : × 5 cibles, la boutique multiplierait les appels à l'API de test Stripe
 * et l'assistant de création (une dizaine de pages par parcours) la durée du run, sans couvrir davantage de comportement.
 */
export const FULL_MATRIX_PROJECT = "desktop-chrome";

/**
 * Scénarios boutique et assistant de création hors `@smoke` (le titre filtré contient le chemin du fichier et les tags).
 */
export const FULL_MATRIX_ONLY = new RegExp(`^(?=.*(?:boutique/|personnage/assistant-))(?!.*${SMOKE})`);

/** Tests `@webhook`, exclus quand aucun `stripe listen` ne relaie les webhooks. */
export const WEBHOOK_ONLY = new RegExp(WEBHOOK);
