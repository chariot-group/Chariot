import { expect, SMOKE, test, WEBHOOK } from "@/shop-fixtures";
import {
  afterPercent,
  applyCode,
  cancelCheckout,
  CARDS,
  codeError,
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
 * Codes d'affiliation (créateurs) au checkout : saisis dans le même champ que les codes promo.
 * - FR-stripe-checkout (Checkout Outcomes) : succès, échec et annulation ; seul un paiement confirmé
 *   crédite les tokens, et le code reste utilisable après un échec ou une annulation.
 * - FR-admin-promo-affiliation-lifecycle : une affiliation désactivée ne s'applique pas.
 * L'usage enregistré côté paiement (commission créateur) est relu via l'API admin.
 */

const USER_DISCOUNT = 10;

test.describe("Code d'affiliation", () => {
  test(
    "succès : la remise créateur est appliquée, payée et l'usage enregistré",
    { tag: [WEBHOOK, SMOKE] },
    async ({ buyer, offers, createAffiliation, adminApi }) => {
      const offer = offers.legendary;
      const { page, api, initialBalance } = buyer;
      const affiliation = await createAffiliation({ userDiscountPercent: USER_DISCOUNT });
      const total = afterPercent(offer.unitAmount, USER_DISCOUNT);

      await goToCheckout(page, offer);
      await applyCode(page, affiliation.code);
      await expectDiscountLine(page, `Réduction (${affiliation.code})`, offer.unitAmount - total);
      await expectTotal(page, total, offer.currency);

      await payWithCard(page, CARDS.success);
      await expectPaymentSuccess(page);
      await expectBalance(api, initialBalance + offer.tokens);
      await expectProfilePurchase(page, initialBalance + offer.tokens, offer.tokens);
      await expect.poll(() => adminApi.affiliationUsageCount(affiliation.id)).toBe(1);
    },
  );

  test("échec : aucun usage enregistré, le code reste utilisable", async ({
    buyer,
    offers,
    createAffiliation,
    adminApi,
  }) => {
    const offer = offers.legendary;
    const { page, api, initialBalance } = buyer;
    const affiliation = await createAffiliation({ userDiscountPercent: USER_DISCOUNT });
    const total = afterPercent(offer.unitAmount, USER_DISCOUNT);

    await goToCheckout(page, offer);
    await applyCode(page, affiliation.code);
    await expectTotal(page, total, offer.currency);
    await payWithCard(page, CARDS.declined);
    await expectPaymentError(page);
    await expectNoPurchase(page, api, initialBalance);
    expect(await adminApi.affiliationUsageCount(affiliation.id)).toBe(0);

    await goToCheckout(page, offer);
    await applyCode(page, affiliation.code);
    await expectTotal(page, total, offer.currency);
  });

  test("annulation : aucun usage enregistré, le code reste utilisable", async ({
    buyer,
    offers,
    createAffiliation,
    adminApi,
  }) => {
    const offer = offers.legendary;
    const { page, api, initialBalance } = buyer;
    const affiliation = await createAffiliation({ userDiscountPercent: USER_DISCOUNT });
    const total = afterPercent(offer.unitAmount, USER_DISCOUNT);

    await goToCheckout(page, offer);
    await applyCode(page, affiliation.code);
    await expectTotal(page, total, offer.currency);
    await cancelCheckout(page);
    await expectNoPurchase(page, api, initialBalance);
    expect(await adminApi.affiliationUsageCount(affiliation.id)).toBe(0);

    await goToCheckout(page, offer);
    await applyCode(page, affiliation.code);
    await expectTotal(page, total, offer.currency);
  });

  test("affiliation désactivée : refusée", async ({ buyer, offers, createAffiliation, adminApi }) => {
    const offer = offers.legendary;
    const { page } = buyer;
    const affiliation = await createAffiliation({ userDiscountPercent: USER_DISCOUNT });
    await adminApi.deactivateAffiliation(affiliation.id);

    await goToCheckout(page, offer);
    await applyCode(page, affiliation.code);
    await expect(codeError(page, "Ce code est introuvable ou n'est plus actif.")).toBeVisible();
    await expectTotal(page, offer.unitAmount, offer.currency);
  });
});
