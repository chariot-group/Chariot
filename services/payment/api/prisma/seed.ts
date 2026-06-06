import 'dotenv/config';
import { PrismaClient, DiscountType, PaymentStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://fake:fake@localhost:5432/fake';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Date aléatoire dans un mois donné (année + mois 0-indexé) */
function randomDateInMonth(year: number, month: number): Date {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = 1 + Math.floor(Math.random() * daysInMonth);
    const hour = Math.floor(Math.random() * 24);
    const min = Math.floor(Math.random() * 60);
    return new Date(year, month, day, hour, min, 0);
}

/** Entier aléatoire dans [min, max] */
function rand(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
}

/** Montant aléatoire parmi des fourchettes réalistes (en centimes) */
function randomAmount(): number {
    const tier = rand(0, 2);
    if (tier === 0) return rand(1500, 3500);   // 15 € – 35 €
    if (tier === 1) return rand(4000, 8000);   // 40 € – 80 €
    return rand(9000, 18000);                  // 90 € – 180 €
}

// ──────────────────────────────────────────────
// Données de référence
// ──────────────────────────────────────────────

const USERS = [
    { id: 'kc-user-alice-0001', name: 'Alice Martin' },
    { id: 'kc-user-bob-0002', name: 'Bob Durand' },
    { id: 'kc-user-charlie-0003', name: 'Charlie Leroy' },
    { id: 'kc-user-diana-0004', name: 'Diana Moreau' },
    { id: 'kc-user-eve-0005', name: 'Eve Bernard' },
    { id: 'kc-user-frank-0006', name: 'Frank Simon' },
    { id: 'kc-user-grace-0007', name: 'Grace Laurent' },
    { id: 'kc-user-hugo-0008', name: 'Hugo Petit' },
    { id: 'kc-user-iris-0009', name: 'Iris Rousseau' },
    { id: 'kc-user-jack-0010', name: 'Jack Fontaine' },
];

/**
 * Distribution des paiements par mois (mars 2025 → mai 2026).
 * Chaque entrée: [année, mois 0-indexé, nbPaiements, % COMPLETED]
 */
const MONTHS: [number, number, number, number][] = [
    [2025, 2, 6, 0.67],  // mars 2025     – lancement timide
    [2025, 3, 8, 0.75],  // avril 2025
    [2025, 4, 10, 0.80],  // mai 2025
    [2025, 5, 12, 0.75],  // juin 2025
    [2025, 6, 14, 0.79],  // juillet 2025  – été
    [2025, 7, 11, 0.73],  // août 2025
    [2025, 8, 9, 0.78],  // septembre 2025
    [2025, 9, 13, 0.77],  // octobre 2025
    [2025, 10, 15, 0.80], // novembre 2025 – Black Friday
    [2025, 11, 10, 0.70], // décembre 2025
    [2026, 0, 8, 0.75],  // janvier 2026
    [2026, 1, 11, 0.82],  // février 2026
    [2026, 2, 13, 0.85],  // mars 2026
    [2026, 3, 12, 0.83],  // avril 2026
    [2026, 4, 7, 0.86],  // mai 2026      – mois courant (partiel)
];

async function main() {
    // ──────────────────────────────────────────────
    // Nettoyage
    // ──────────────────────────────────────────────
    await prisma.promoCodeUsage.deleteMany();
    await prisma.affiliationUsage.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.promoCode.deleteMany();
    await prisma.affiliation.deleteMany();

    // ──────────────────────────────────────────────
    // Codes promo
    // ──────────────────────────────────────────────
    const promoCodes = await Promise.all([
        prisma.promoCode.create({
            data: {
                code: 'BIENVENUE10',
                name: 'Bienvenue – 10 %',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 10,
                isFirstOrderOnly: true,
                maxUsesPerUser: 1,
                isActive: true,
            },
        }),
        prisma.promoCode.create({
            data: {
                code: 'FLAT500',
                name: '5 € de réduction',
                discountType: DiscountType.FIXED,
                discountValue: 500,
                minOrderAmount: 2000,
                maxTotalUses: 200,
                maxUsesPerUser: 3,
                isActive: true,
            },
        }),
        prisma.promoCode.create({
            data: {
                code: 'SUMMER2025',
                name: 'Été 2025 – 15 %',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 15,
                expiresAt: new Date('2025-09-01T00:00:00Z'),
                maxUsesPerUser: 1,
                isActive: false,
            },
        }),
        prisma.promoCode.create({
            data: {
                code: 'NOEL2025',
                name: 'Noël 2025 – 20 %',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                expiresAt: new Date('2026-01-05T00:00:00Z'),
                maxUsesPerUser: 1,
                isActive: false,
            },
        }),
        prisma.promoCode.create({
            data: {
                code: 'FLAT1000',
                name: '10 € de réduction',
                discountType: DiscountType.FIXED,
                discountValue: 1000,
                minOrderAmount: 5000,
                maxTotalUses: 50,
                maxUsesPerUser: 1,
                isActive: true,
            },
        }),
    ]);

    console.log('PromoCodes :', promoCodes.map((p) => p.code).join(', '));

    // ──────────────────────────────────────────────
    // Affiliations
    // ──────────────────────────────────────────────
    const affiliations = await Promise.all([
        prisma.affiliation.create({
            data: {
                code: 'ALICE2025',
                name: 'Alice Streamer',
                creatorUserId: 'kc-user-alice-0001',
                creatorName: 'Alice Martin',
                creatorCommissionPercent: 10,
                userDiscountPercent: 5,
                isActive: true,
            },
        }),
        prisma.affiliation.create({
            data: {
                code: 'BOB2025',
                name: 'Bob Influenceur',
                creatorUserId: 'kc-user-bob-0002',
                creatorName: 'Bob Durand',
                creatorCommissionPercent: 8,
                userDiscountPercent: 3,
                isActive: true,
            },
        }),
        prisma.affiliation.create({
            data: {
                code: 'GRACE_YT',
                name: 'Grace YouTube',
                creatorUserId: 'kc-user-grace-0007',
                creatorName: 'Grace Laurent',
                creatorCommissionPercent: 12,
                userDiscountPercent: 7,
                isActive: true,
            },
        }),
        prisma.affiliation.create({
            data: {
                code: 'HUGO_IG',
                name: 'Hugo Instagram',
                creatorUserId: 'kc-user-hugo-0008',
                creatorName: 'Hugo Petit',
                creatorCommissionPercent: 6,
                userDiscountPercent: 4,
                isActive: false,
            },
        }),
    ]);

    console.log('Affiliations :', affiliations.map((a) => a.code).join(', '));

    // ──────────────────────────────────────────────
    // Paiements + usages
    // ──────────────────────────────────────────────
    let totalPayments = 0;
    let sessionCounter = 1000;

    // Suivi des usages uniquement pour la contrainte isFirstOrderOnly
    const firstOrderUsed: Record<string, Set<string>> = {}; // promoId -> Set<userId>

    for (const [year, month, count, completedRate] of MONTHS) {
        for (let i = 0; i < count; i++) {
            const createdAt = randomDateInMonth(year, month);
            const user = USERS[rand(0, USERS.length - 1)];
            const amount = randomAmount();

            // Statut
            const roll = Math.random();
            let status: PaymentStatus;
            if (roll < completedRate) {
                status = PaymentStatus.COMPLETED;
            } else if (roll < completedRate + 0.10) {
                status = PaymentStatus.FAILED;
            } else if (roll < completedRate + 0.18) {
                status = PaymentStatus.REFUNDED;
            } else {
                status = PaymentStatus.PENDING;
            }

            const sessionId = `cs_test_seed${String(sessionCounter).padStart(6, '0')}`;
            const intentId = status !== PaymentStatus.PENDING
                ? `pi_test_seed${String(sessionCounter).padStart(6, '0')}`
                : null;
            sessionCounter++;

            // Promo / affiliation uniquement sur les paiements COMPLETED ou REFUNDED
            let promoCodeId: string | null = null;
            let affiliationId: string | null = null;
            let discountAmount = 0;

            if (status === PaymentStatus.COMPLETED || status === PaymentStatus.REFUNDED) {
                const promoRoll = Math.random();
                const affiliationRoll = Math.random();

                // ~28 % utilisent un code promo
                if (promoRoll < 0.28) {
                    const promo = promoCodes[rand(0, promoCodes.length - 1)];

                    // Vérifier contrainte isFirstOrderOnly
                    const usersWhoUsed = firstOrderUsed[promo.id] ?? new Set<string>();
                    const canUse = !promo.isFirstOrderOnly || !usersWhoUsed.has(user.id);

                    if (canUse) {
                        promoCodeId = promo.id;
                        if (promo.discountType === DiscountType.PERCENTAGE) {
                            discountAmount = Math.round(amount * promo.discountValue / 100);
                        } else {
                            discountAmount = amount >= (promo.minOrderAmount ?? 0) ? promo.discountValue : 0;
                        }

                        // Enregistrer uniquement les usages isFirstOrderOnly
                        if (promo.isFirstOrderOnly) {
                            usersWhoUsed.add(user.id);
                            firstOrderUsed[promo.id] = usersWhoUsed;
                        }
                    }
                }

                // ~22 % utilisent une affiliation (mutuellement exclusif avec promo)
                if (!promoCodeId && affiliationRoll < 0.22) {
                    const aff = affiliations[rand(0, affiliations.length - 1)];
                    affiliationId = aff.id;
                    discountAmount = Math.round(amount * aff.userDiscountPercent / 100);
                }
            }

            const finalAmount = amount - discountAmount;

            const payment = await prisma.payment.create({
                data: {
                    userId: user.id,
                    stripeSessionId: sessionId,
                    stripePaymentIntentId: intentId,
                    amount,
                    discountAmount,
                    finalAmount,
                    currency: 'eur',
                    status,
                    promoCodeId,
                    affiliationId,
                    createdAt,
                    updatedAt: createdAt,
                },
            });

            // PromoCodeUsage
            if (promoCodeId) {
                await prisma.promoCodeUsage.create({
                    data: {
                        userId: user.id,
                        orderId: sessionId,
                        promoCodeId,
                        usedAt: createdAt,
                    },
                });
            }

            // AffiliationUsage
            if (affiliationId) {
                const aff = affiliations.find((a) => a.id === affiliationId)!;
                await prisma.affiliationUsage.create({
                    data: {
                        userId: user.id,
                        orderId: sessionId,
                        orderAmount: amount,
                        commissionAmount: Math.round(amount * aff.creatorCommissionPercent / 100),
                        affiliationId,
                        usedAt: createdAt,
                    },
                });
            }

            totalPayments++;
        }
    }

    // ──────────────────────────────────────────────
    // Paiements garantis avec codes promo (derniers mois)
    // Assure que la section "Performance des codes promo" du dashboard
    // n'est jamais vide sur la plage des 30/90 derniers jours.
    // ──────────────────────────────────────────────
    const guaranteedPromos: { year: number; month: number; day: number; promoIndex: number; userIndex: number }[] = [
        // Mars 2026
        { year: 2026, month: 2, day: 5, promoIndex: 0, userIndex: 2 }, // BIENVENUE10
        { year: 2026, month: 2, day: 12, promoIndex: 1, userIndex: 3 }, // FLAT500
        { year: 2026, month: 2, day: 20, promoIndex: 4, userIndex: 5 }, // FLAT1000
        // Avril 2026
        { year: 2026, month: 3, day: 3, promoIndex: 1, userIndex: 6 }, // FLAT500
        { year: 2026, month: 3, day: 10, promoIndex: 2, userIndex: 7 }, // SUMMER2025
        { year: 2026, month: 3, day: 22, promoIndex: 3, userIndex: 8 }, // NOEL2025
        { year: 2026, month: 3, day: 28, promoIndex: 4, userIndex: 9 }, // FLAT1000
        // Mai 2026
        { year: 2026, month: 4, day: 2, promoIndex: 0, userIndex: 4 }, // BIENVENUE10
        { year: 2026, month: 4, day: 8, promoIndex: 1, userIndex: 5 }, // FLAT500
        { year: 2026, month: 4, day: 14, promoIndex: 2, userIndex: 6 }, // SUMMER2025
        { year: 2026, month: 4, day: 18, promoIndex: 4, userIndex: 7 }, // FLAT1000
    ];

    for (const g of guaranteedPromos) {
        const promo = promoCodes[g.promoIndex];
        const user = USERS[g.userIndex];
        const amount = randomAmount();
        const createdAt = new Date(g.year, g.month, g.day, rand(9, 18), rand(0, 59));

        let discountAmount = 0;
        if (promo.discountType === DiscountType.PERCENTAGE) {
            discountAmount = Math.round(amount * promo.discountValue / 100);
        } else {
            discountAmount = amount >= (promo.minOrderAmount ?? 0) ? promo.discountValue : 0;
        }
        const finalAmount = amount - discountAmount;

        const sessionId = `cs_test_seed${String(sessionCounter).padStart(6, '0')}`;
        const intentId = `pi_test_seed${String(sessionCounter).padStart(6, '0')}`;
        sessionCounter++;

        await prisma.payment.create({
            data: {
                userId: user.id,
                stripeSessionId: sessionId,
                stripePaymentIntentId: intentId,
                amount,
                discountAmount,
                finalAmount,
                currency: 'eur',
                status: PaymentStatus.COMPLETED,
                promoCodeId: promo.id,
                createdAt,
                updatedAt: createdAt,
            },
        });

        await prisma.promoCodeUsage.create({
            data: {
                userId: user.id,
                orderId: sessionId,
                promoCodeId: promo.id,
                usedAt: createdAt,
            },
        });

        totalPayments++;
    }

    // Mise à jour currentTotalUses sur chaque promo
    for (const promo of promoCodes) {
        const usages = await prisma.promoCodeUsage.count({ where: { promoCodeId: promo.id } });
        await prisma.promoCode.update({
            where: { id: promo.id },
            data: { currentTotalUses: usages },
        });
    }

    console.log(`Paiements créés : ${totalPayments}`);
    console.log('Seed terminé avec succès.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

