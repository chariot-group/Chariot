// ─────────────────────────────────────────────────────────────────────────────
// Shared referral system rules
//
// Tiers (parrain) :
//   - Palier 1 : 1 filleul validé → 10%
//   - Palier 2 : 2 filleuls validés → 15%
//   - Chaque palier suivant : +1 filleul, +5%
//   - Maximum : 50% (atteint au palier 9, soit 9 filleuls)
//
// Filleul : toujours 15% de réduction, utilisable une seule fois
//
// Règles de cumul :
//   - La réduction de parrainage (filleul ou parrain) n'est pas cumulable avec
//     un code promo ou d'affiliation.
//   - Si une personne a les deux rôles (filleul + parrain), la réduction la plus
//     haute est appliquée.
//   - Après chaque commande d'un parrain avec sa réduction, son compteur
//     repasse à 0 (palier 0 = pas de réduction).
//
// Un filleul est comptabilisé uniquement après sa première commande avec sa
// réduction de filleul (firstPurchaseValidatedAt non nul).
// ─────────────────────────────────────────────────────────────────────────────

export const REFEREE_DISCOUNT_PERCENT = 15;
export const REFERRER_BASE_DISCOUNT_PERCENT = 10;
export const REFERRER_DISCOUNT_INCREMENT_PERCENT = 5;
export const REFERRER_MAX_DISCOUNT_PERCENT = 50;

export type ReferralTier = {
    /** Nombre minimum de filleuls validés pour atteindre ce palier */
    minReferees: number;
    /** Pourcentage de réduction associé */
    discount: number;
};

/**
 * Liste des paliers de parrainage, du plus haut au plus bas (pour l'affichage
 * en pyramide : index 0 = sommet, dernier index = base).
 *
 * Générée automatiquement depuis les constantes pour rester en sync avec le backend.
 */
export const REFERRAL_TIERS: ReferralTier[] = (() => {
    const tiers: ReferralTier[] = [];
    for (let n = 1; ; n++) {
        const discount =
            REFERRER_BASE_DISCOUNT_PERCENT +
            (n - 1) * REFERRER_DISCOUNT_INCREMENT_PERCENT;
        tiers.push({ minReferees: n, discount: Math.min(discount, REFERRER_MAX_DISCOUNT_PERCENT) });
        if (discount >= REFERRER_MAX_DISCOUNT_PERCENT) break;
    }
    return tiers.reverse(); // sommet en premier
})();

/**
 * Calcule le pourcentage de réduction parrain à partir du nombre de filleuls
 * validés en attente (depuis la dernière commande du parrain).
 *
 * Doit rester identique à `ReferralService.computeReferrerDiscount` côté backend.
 */
export function computeReferrerDiscount(pendingCount: number): number {
    if (pendingCount <= 0) return 0;
    return Math.min(
        REFERRER_BASE_DISCOUNT_PERCENT +
        (pendingCount - 1) * REFERRER_DISCOUNT_INCREMENT_PERCENT,
        REFERRER_MAX_DISCOUNT_PERCENT,
    );
}

/**
 * Retourne la réduction effective disponible pour l'utilisateur sur son prochain
 * achat, en appliquant la règle FR-stripe-checkout : si l'user est à la fois
 * parrain et filleul, seule la réduction la plus haute s'applique.
 *
 * Retourne 0 si aucune réduction n'est disponible.
 */
export function computeEffectiveReferralDiscount(referralInfo: {
    currentDiscountPercent: number;
    myRefereeDiscount: { available: boolean; discountPercent: number } | null;
}): number {
    const parrainDiscount = referralInfo.currentDiscountPercent ?? 0;
    const filleulDiscount =
        referralInfo.myRefereeDiscount?.available
            ? (referralInfo.myRefereeDiscount.discountPercent ?? 0)
            : 0;
    return Math.max(parrainDiscount, filleulDiscount);
}
