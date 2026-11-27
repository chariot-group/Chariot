import { env } from "@/env";
import { expect, SMOKE, test, WEBHOOK } from "@/shop-fixtures";
import {
  answerThreeDSecure,
  cancelCheckout,
  CARDS,
  expectBalance,
  expectNoPurchase,
  expectPaymentError,
  expectPaymentSuccess,
  expectProfilePurchase,
  expectTotal,
  goToCheckout,
  PACKS,
  payButton,
  payWithCard,
  summary,
} from "@/shop";

/**
 * Funnel de vente par pack : boutique → checkout → paiement Stripe (mode test) → retour.
 * - FR-stripe-checkout (Checkout Outcomes) : succès, échec et annulation pour chaque pack du catalogue ;
 *   seul un paiement confirmé crédite `token_number × quantité` ; page de retour jamais vide.
 * - FR-profile-token-history / FR-user-balance-history : solde et ligne d'achat « Boutique » au profil.
 *
 * Chaque test a son propre acheteur jetable. Les succès attendent le webhook Stripe (`@webhook`).
 * Matrice complète sur desktop-chrome ; les autres cibles jouent les tests `@smoke`.
 */

for (const pack of PACKS) {
  // Le pack Explorateur porte le sous-ensemble joué sur toutes les cibles.
  const smoke = pack.key === "explorator" ? [SMOKE] : [];

  test.describe(pack.label, () => {
    test("succès : le paiement crédite les tokens du pack", { tag: [WEBHOOK, ...smoke] }, async ({ buyer, offers }) => {
      const offer = offers[pack.key];
      const { page, api, initialBalance } = buyer;

      await goToCheckout(page, offer);
      await expectTotal(page, offer.unitAmount, offer.currency);
      await payWithCard(page, CARDS.success);

      await expectPaymentSuccess(page);
      await expectBalance(api, initialBalance + offer.tokens);
      await expectProfilePurchase(page, initialBalance + offer.tokens, offer.tokens);
    });

    test("échec : une carte refusée affiche l'erreur sans créditer", { tag: smoke }, async ({ buyer, offers }) => {
      const { page, api, initialBalance } = buyer;

      await goToCheckout(page, offers[pack.key]);
      await payWithCard(page, CARDS.declined);

      await expectPaymentError(page);
      await expectNoPurchase(page, api, initialBalance);
    });

    test(
      "annulation : quitter le checkout avec « Retour » ne crédite rien",
      { tag: smoke },
      async ({ buyer, offers }) => {
        const { page, api, initialBalance } = buyer;

        await goToCheckout(page, offers[pack.key]);
        await cancelCheckout(page);

        expect(new URL(page.url()).pathname).toBe(`/${env.locale}/profile`);
        await expectNoPurchase(page, api, initialBalance);
      },
    );
  });
}

test.describe("Variantes de paiement", () => {
  test("3-D Secure accepté : le paiement aboutit", { tag: WEBHOOK }, async ({ buyer, offers }) => {
    const offer = offers.explorator;
    const { page, api, initialBalance } = buyer;

    await goToCheckout(page, offer);
    await payWithCard(page, CARDS.threeDSecure);
    await answerThreeDSecure(page, "COMPLETE");

    await expectPaymentSuccess(page);
    await expectBalance(api, initialBalance + offer.tokens);
  });

  test("3-D Secure refusé : erreur affichée, rien n'est crédité", async ({ buyer, offers }) => {
    const { page, api, initialBalance } = buyer;

    await goToCheckout(page, offers.explorator);
    await payWithCard(page, CARDS.threeDSecure);
    await answerThreeDSecure(page, "FAIL");

    await expectPaymentError(page);
    await expectNoPurchase(page, api, initialBalance);
  });

  test("3-D Secure abandonné : erreur affichée, rien n'est crédité", async ({ buyer, offers }) => {
    const { page, api, initialBalance } = buyer;

    await goToCheckout(page, offers.explorator);
    await payWithCard(page, CARDS.threeDSecure);
    await answerThreeDSecure(page, "ANNULER");

    await expectPaymentError(page);
    await expectNoPurchase(page, api, initialBalance);
  });

  test("fonds insuffisants : erreur affichée, rien n'est crédité", async ({ buyer, offers }) => {
    const { page, api, initialBalance } = buyer;

    await goToCheckout(page, offers.explorator);
    await payWithCard(page, CARDS.insufficientFunds);

    await expectPaymentError(page);
    await expectNoPurchase(page, api, initialBalance);
  });

  test("après un refus, un nouvel essai réussi crédite une seule fois", { tag: WEBHOOK }, async ({ buyer, offers }) => {
    const offer = offers.explorator;
    const { page, api, initialBalance } = buyer;

    await goToCheckout(page, offer);
    await payWithCard(page, CARDS.declined);
    await expectPaymentError(page);

    await payWithCard(page, CARDS.success);
    await expectPaymentSuccess(page);
    await expectBalance(api, initialBalance + offer.tokens);
    await expectProfilePurchase(page, initialBalance + offer.tokens, offer.tokens);
  });

  test("quantité 2 : le total double et les tokens crédités aussi", { tag: WEBHOOK }, async ({ buyer, offers }) => {
    const offer = offers.explorator;
    const { page, api, initialBalance } = buyer;

    await goToCheckout(page, offer);
    await page.getByRole("button", { name: "Augmenter la quantité" }).click();
    await expect(summary(page).getByText("×2")).toBeVisible();
    await expectTotal(page, offer.unitAmount * 2, offer.currency);

    await payWithCard(page, CARDS.success);
    await expectPaymentSuccess(page);
    await expectBalance(api, initialBalance + offer.tokens * 2);
  });
});

test.describe("Page de retour", () => {
  test("un statut Stripe en échec affiche « Paiement non complété »", { tag: SMOKE }, async ({ buyer }) => {
    const { page } = buyer;

    await page.goto(`/${env.locale}/checkout/return?redirect_status=failed`);
    await expect(page.getByRole("heading", { name: "Paiement non complété" })).toBeVisible();
    await page.getByRole("button", { name: "Retourner au profil" }).click();
    await page.waitForURL((url) => url.pathname === `/${env.locale}/profile`);
  });

  test("sans statut de paiement, la page affiche l'échec", async ({ buyer }) => {
    const { page } = buyer;

    await page.goto(`/${env.locale}/checkout/return`);
    await expect(page.getByRole("heading", { name: "Paiement non complété" })).toBeVisible();
    await expect(payButton(page)).toHaveCount(0);
  });
});
