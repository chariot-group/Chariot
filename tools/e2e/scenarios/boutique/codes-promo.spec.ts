import { expect, SMOKE, test, WEBHOOK } from "@/shop-fixtures";
import {
  afterPercent,
  applyCode,
  cancelCheckout,
  CARDS,
  codeError,
  confirmFreeOrder,
  discountLine,
  expectBalance,
  expectDiscountLine,
  expectNoPurchase,
  expectPaymentError,
  expectPaymentSuccess,
  expectProfilePurchase,
  expectTotal,
  goToCheckout,
  payWithCard,
} from "@/shop";

/**
 * Codes promo au checkout.
 * - FR-stripe-checkout (Checkout Outcomes) : l'usage d'un code n'est consommé que sur un paiement confirmé ;
 *   après un échec ou une annulation, le même code reste utilisable.
 * - FR-stripe-checkout (Below-Minimum and Free Checkout Orders) : commande gratuite, ligne « Cadeau ».
 * - FR-admin-promo-affiliation-lifecycle : un code désactivé ne s'applique pas.
 * - FR-form-field-validation : erreurs de code visibles et annoncées (`role="alert"`).
 *
 * Codes créés via l'API paiement par un admin jetable (un par worker), supprimés en fin de test.
 */

const PERCENT = 20;
const USER_LIMIT_MESSAGE = "Vous avez déjà utilisé ce code le nombre maximum de fois autorisé.";

test.describe("Code promo en pourcentage", () => {
  test(
    "succès : la remise est appliquée, payée, puis le code est consommé",
    { tag: [WEBHOOK, SMOKE] },
    async ({ buyer, offers, createPromo }) => {
      const offer = offers.aventurer;
      const { page, api, initialBalance } = buyer;
      const promo = await createPromo({ discountType: "PERCENTAGE", discountValue: PERCENT, maxUsesPerUser: 1 });
      const total = afterPercent(offer.unitAmount, PERCENT);

      await test.step("appliquer le code", async () => {
        await goToCheckout(page, offer);
        await applyCode(page, promo.code);
        await expectDiscountLine(page, `Réduction (${promo.code})`, offer.unitAmount - total);
        await expectTotal(page, total, offer.currency);
      });

      await test.step("payer : tokens crédités", async () => {
        await payWithCard(page, CARDS.success);
        await expectPaymentSuccess(page);
        await expectBalance(api, initialBalance + offer.tokens);
        await expectProfilePurchase(page, initialBalance + offer.tokens, offer.tokens);
      });

      await test.step("le code n'est plus utilisable par ce compte", async () => {
        await goToCheckout(page, offer);
        await applyCode(page, promo.code);
        await expect(codeError(page, USER_LIMIT_MESSAGE)).toBeVisible();
        await expectTotal(page, offer.unitAmount, offer.currency);
      });
    },
  );

  test("échec : après une carte refusée, le code reste utilisable", async ({ buyer, offers, createPromo }) => {
    const offer = offers.aventurer;
    const { page, api, initialBalance } = buyer;
    const promo = await createPromo({ discountType: "PERCENTAGE", discountValue: PERCENT, maxUsesPerUser: 1 });

    await goToCheckout(page, offer);
    await applyCode(page, promo.code);
    await expectTotal(page, afterPercent(offer.unitAmount, PERCENT), offer.currency);
    await payWithCard(page, CARDS.declined);
    await expectPaymentError(page);
    await expectNoPurchase(page, api, initialBalance);

    await goToCheckout(page, offer);
    await applyCode(page, promo.code);
    await expectTotal(page, afterPercent(offer.unitAmount, PERCENT), offer.currency);
  });

  test("annulation : après « Retour », le code reste utilisable", async ({ buyer, offers, createPromo }) => {
    const offer = offers.aventurer;
    const { page, api, initialBalance } = buyer;
    const promo = await createPromo({ discountType: "PERCENTAGE", discountValue: PERCENT, maxUsesPerUser: 1 });

    await goToCheckout(page, offer);
    await applyCode(page, promo.code);
    await expectTotal(page, afterPercent(offer.unitAmount, PERCENT), offer.currency);
    await cancelCheckout(page);
    await expectNoPurchase(page, api, initialBalance);

    await goToCheckout(page, offer);
    await applyCode(page, promo.code);
    await expectTotal(page, afterPercent(offer.unitAmount, PERCENT), offer.currency);
  });

  test("retirer le code rétablit le prix plein", async ({ buyer, offers, createPromo }) => {
    const offer = offers.aventurer;
    const { page } = buyer;
    const promo = await createPromo({ discountType: "PERCENTAGE", discountValue: PERCENT });

    await goToCheckout(page, offer);
    await applyCode(page, promo.code);
    await expectTotal(page, afterPercent(offer.unitAmount, PERCENT), offer.currency);

    await page.getByRole("button", { name: "Retirer le code" }).click();
    await expect(discountLine(page, `Réduction (${promo.code})`)).toHaveCount(0);
    await expectTotal(page, offer.unitAmount, offer.currency);
    await expect(page.getByRole("textbox", { name: "Code de réduction" })).toBeEditable();
  });
});

test.describe("Commande gratuite et minimum Stripe", () => {
  test("code à 100 % : commande gratuite sans carte, tokens crédités", async ({ buyer, offers, createPromo }) => {
    const offer = offers.explorator;
    const { page, api, initialBalance } = buyer;
    const promo = await createPromo({ discountType: "PERCENTAGE", discountValue: 100 });

    await goToCheckout(page, offer);
    await applyCode(page, promo.code);
    await expectTotal(page, 0, offer.currency);
    await confirmFreeOrder(page);

    // Commande gratuite traitée sans Stripe : crédit immédiat, sans webhook.
    await expectPaymentSuccess(page);
    await expectBalance(api, initialBalance + offer.tokens);
    await expectProfilePurchase(page, initialBalance + offer.tokens, offer.tokens);
  });

  test("reste sous 0,50 € : ligne « Cadeau » et commande gratuite", async ({ buyer, offers, createPromo }) => {
    const offer = offers.explorator;
    const { page, api, initialBalance } = buyer;
    const remainder = 30;
    const promo = await createPromo({ discountType: "FIXED", discountValue: offer.unitAmount - remainder });

    await goToCheckout(page, offer);
    await applyCode(page, promo.code);
    await expectDiscountLine(page, `Réduction (${promo.code})`, offer.unitAmount - remainder);
    await expectDiscountLine(page, "Cadeau", remainder);
    await expectTotal(page, 0, offer.currency);
    await confirmFreeOrder(page);

    await expectPaymentSuccess(page);
    await expectBalance(api, initialBalance + offer.tokens);
  });
});

test.describe("Codes refusés", () => {
  test("code inconnu", { tag: SMOKE }, async ({ buyer, offers }) => {
    const offer = offers.explorator;
    const { page } = buyer;

    await goToCheckout(page, offer);
    await applyCode(page, "E2E-INCONNU-0000");
    await expect(codeError(page, "Ce code est introuvable ou n'est plus actif.")).toBeVisible();
    await expectTotal(page, offer.unitAmount, offer.currency);
  });

  test("code désactivé", async ({ buyer, offers, createPromo, adminApi }) => {
    const offer = offers.explorator;
    const { page } = buyer;
    const promo = await createPromo({ discountType: "PERCENTAGE", discountValue: PERCENT });
    await adminApi.deactivatePromoCode(promo.id);

    await goToCheckout(page, offer);
    await applyCode(page, promo.code);
    await expect(codeError(page, "Ce code est introuvable ou n'est plus actif.")).toBeVisible();
    await expectTotal(page, offer.unitAmount, offer.currency);
  });

  test("panier minimum non atteint", async ({ buyer, offers, createPromo }) => {
    const offer = offers.explorator;
    const { page } = buyer;
    const minOrderAmount = offer.unitAmount * 10;
    const promo = await createPromo({ discountType: "PERCENTAGE", discountValue: PERCENT, minOrderAmount });

    await goToCheckout(page, offer);
    await applyCode(page, promo.code);
    await expect(codeError(page, /^Ce code nécessite un panier minimum de/)).toBeVisible();
    await expectTotal(page, offer.unitAmount, offer.currency);
  });

  test("réservé à la première commande, refusé après un premier achat", async ({ buyer, offers, createPromo }) => {
    const offer = offers.explorator;
    const { page, api, initialBalance } = buyer;
    const free = await createPromo({ discountType: "PERCENTAGE", discountValue: 100 });
    const firstOrderOnly = await createPromo({
      discountType: "PERCENTAGE",
      discountValue: PERCENT,
      isFirstOrderOnly: true,
    });

    await test.step("première commande (gratuite)", async () => {
      await goToCheckout(page, offer);
      await applyCode(page, free.code);
      await confirmFreeOrder(page);
      await expectPaymentSuccess(page);
      await expectBalance(api, initialBalance + offer.tokens);
    });

    await goToCheckout(page, offer);
    await applyCode(page, firstOrderOnly.code);
    await expect(codeError(page, "Ce code est réservé à votre première commande.")).toBeVisible();
    await expectTotal(page, offer.unitAmount, offer.currency);
  });

  test("nombre maximum d'utilisations atteint", async ({ buyer, offers, createPromo, openBuyer }) => {
    const offer = offers.explorator;
    const promo = await createPromo({ discountType: "PERCENTAGE", discountValue: 100, maxTotalUses: 1 });

    await test.step("un autre compte utilise le code", async () => {
      const other = await openBuyer({ tag: "shop" });
      await goToCheckout(other.page, offer);
      await applyCode(other.page, promo.code);
      await confirmFreeOrder(other.page);
      await expectPaymentSuccess(other.page);
    });

    await goToCheckout(buyer.page, offer);
    await applyCode(buyer.page, promo.code);
    await expect(codeError(buyer.page, "Ce code a atteint son nombre maximum d'utilisations.")).toBeVisible();
    await expectTotal(buyer.page, offer.unitAmount, offer.currency);
  });
});
