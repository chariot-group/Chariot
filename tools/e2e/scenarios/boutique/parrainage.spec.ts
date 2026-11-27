import type { Page } from "@playwright/test";
import { env } from "@/env";
import { GatewayError } from "@/payment";
import { expect, SMOKE, test, WEBHOOK, type Buyer, type OpenBuyer } from "@/shop-fixtures";
import {
  afterPercent,
  cancelCheckout,
  CARDS,
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
  type PackOffer,
} from "@/shop";

/**
 * Parrainage (FR-stripe-checkout — Referral System et Checkout Outcomes).
 * - Le filleul arrive par le lien `/?ref=CODE` puis se connecte : −15 % sur sa prochaine commande.
 * - La réduction filleul n'est consommée, et le filleul validé pour son parrain, qu'au paiement confirmé :
 *   après un échec ou une annulation, elle reste disponible.
 * - Le parrain gagne −10 % dès un filleul validé ; son palier repart à 0 après usage.
 * - Réduction automatique, non cumulable : le champ de code est désactivé.
 * - Un utilisateur ne peut pas utiliser son propre code.
 *
 * Parrain et filleul sont deux comptes jetables, chacun dans son propre contexte navigateur.
 */

const REFEREE_PERCENT = 15;
const REFERRER_FIRST_TIER_PERCENT = 10;

type ReferralPair = { referrer: Buyer; referee: Buyer };

/** Crée un parrain (code généré à sa première connexion) puis un filleul arrivé par son lien. */
async function referralPair(openBuyer: OpenBuyer): Promise<ReferralPair> {
  const referrer = await openBuyer({ tag: "parrain" });
  const { code } = await referrer.api.myReferral();
  const referee = await openBuyer({ tag: "filleul", landingPath: `/${env.locale}?ref=${code}` });
  await expect
    .poll(async () => (await referee.api.myReferral()).myRefereeDiscount?.available ?? false, {
      message: "filleul rattaché au parrain via le lien ?ref=",
    })
    .toBe(true);
  return { referrer, referee };
}

/** Réduction parrainage affichée : badge, ligne du récapitulatif, champ de code désactivé. */
async function expectReferralDiscount(page: Page, offer: PackOffer, percent: number): Promise<void> {
  const total = afterPercent(offer.unitAmount, percent);
  await expect(page.getByText(`-${percent} %`)).toBeVisible();
  await expectDiscountLine(page, "Réduction parrainage", offer.unitAmount - total);
  await expectTotal(page, total, offer.currency);
  await expect(page.getByText("Non cumulable avec un autre code de réduction.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Code de réduction" })).toBeDisabled();
}

async function expectNoReferralDiscount(page: Page, offer: PackOffer): Promise<void> {
  await expectTotal(page, offer.unitAmount, offer.currency);
  await expect(discountLine(page, "Réduction parrainage")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Code de réduction" })).toBeEnabled();
}

test.describe("Filleul", () => {
  test(
    "succès : −15 % sur la première commande, consommé ensuite, parrain crédité d'un palier",
    { tag: [WEBHOOK, SMOKE] },
    async ({ offers, openBuyer }) => {
      const offer = offers.aventurer;
      const { referrer, referee } = await referralPair(openBuyer);

      await test.step("checkout avec la réduction filleul", async () => {
        await goToCheckout(referee.page, offer);
        await expectReferralDiscount(referee.page, offer, REFEREE_PERCENT);
      });

      await test.step("payer : tokens crédités", async () => {
        await payWithCard(referee.page, CARDS.success);
        await expectPaymentSuccess(referee.page);
        await expectBalance(referee.api, referee.initialBalance + offer.tokens);
        await expectProfilePurchase(referee.page, referee.initialBalance + offer.tokens, offer.tokens);
      });

      await test.step("la réduction filleul est consommée", async () => {
        await goToCheckout(referee.page, offer);
        await expectNoReferralDiscount(referee.page, offer);
      });

      await test.step("le parrain a un filleul validé et −10 %", async () => {
        await expect.poll(async () => (await referrer.api.myReferral()).validatedRefereeCount).toBe(1);
        expect((await referrer.api.myReferral()).currentDiscountPercent).toBe(REFERRER_FIRST_TIER_PERCENT);
      });
    },
  );

  test("échec : après une carte refusée, la réduction reste disponible et le filleul n'est pas validé", async ({
    offers,
    openBuyer,
  }) => {
    const offer = offers.aventurer;
    const { referrer, referee } = await referralPair(openBuyer);

    await goToCheckout(referee.page, offer);
    await expectReferralDiscount(referee.page, offer, REFEREE_PERCENT);
    await payWithCard(referee.page, CARDS.declined);
    await expectPaymentError(referee.page);
    await expectNoPurchase(referee.page, referee.api, referee.initialBalance);

    await goToCheckout(referee.page, offer);
    await expectReferralDiscount(referee.page, offer, REFEREE_PERCENT);
    const referral = await referrer.api.myReferral();
    expect(referral.validatedRefereeCount).toBe(0);
    expect(referral.currentDiscountPercent).toBe(0);
  });

  test("annulation : après « Retour », la réduction reste disponible et le filleul n'est pas validé", async ({
    offers,
    openBuyer,
  }) => {
    const offer = offers.aventurer;
    const { referrer, referee } = await referralPair(openBuyer);

    await goToCheckout(referee.page, offer);
    await expectReferralDiscount(referee.page, offer, REFEREE_PERCENT);
    await cancelCheckout(referee.page);
    await expectNoPurchase(referee.page, referee.api, referee.initialBalance);

    await goToCheckout(referee.page, offer);
    await expectReferralDiscount(referee.page, offer, REFEREE_PERCENT);
    expect((await referrer.api.myReferral()).validatedRefereeCount).toBe(0);
  });
});

test.describe("Parrain", () => {
  test(
    "−10 % après le premier achat du filleul, palier remis à 0 après usage",
    { tag: WEBHOOK },
    async ({ offers, openBuyer }) => {
      const offer = offers.legendary;
      const { referrer, referee } = await referralPair(openBuyer);

      await test.step("aucune réduction parrain tant que le filleul n'a pas payé", async () => {
        await goToCheckout(referrer.page, offer);
        await expectNoReferralDiscount(referrer.page, offer);
      });

      await test.step("le filleul paie sa première commande", async () => {
        await goToCheckout(referee.page, offers.explorator);
        await payWithCard(referee.page, CARDS.success);
        await expectPaymentSuccess(referee.page);
        await expect
          .poll(async () => (await referrer.api.myReferral()).currentDiscountPercent)
          .toBe(REFERRER_FIRST_TIER_PERCENT);
      });

      await test.step("le profil du parrain annonce la réduction", async () => {
        await referrer.page.goto(`/${env.locale}/profile`);
        await expect(
          referrer.page.getByText(`${REFERRER_FIRST_TIER_PERCENT} % sur votre prochain achat`),
        ).toBeVisible();
      });

      await test.step("le parrain paie avec −10 %", async () => {
        await goToCheckout(referrer.page, offer);
        await expectReferralDiscount(referrer.page, offer, REFERRER_FIRST_TIER_PERCENT);
        await payWithCard(referrer.page, CARDS.success);
        await expectPaymentSuccess(referrer.page);
        await expectBalance(referrer.api, referrer.initialBalance + offer.tokens);
      });

      await test.step("palier remis à 0 : plus de réduction", async () => {
        await expect.poll(async () => (await referrer.api.myReferral()).currentDiscountPercent).toBe(0);
        await goToCheckout(referrer.page, offer);
        await expectNoReferralDiscount(referrer.page, offer);
      });
    },
  );

  test(
    "échec : après une carte refusée, la réduction parrain reste disponible",
    { tag: WEBHOOK },
    async ({ offers, openBuyer }) => {
      const offer = offers.legendary;
      const { referrer, referee } = await referralPair(openBuyer);

      await goToCheckout(referee.page, offers.explorator);
      await payWithCard(referee.page, CARDS.success);
      await expectPaymentSuccess(referee.page);
      await expect
        .poll(async () => (await referrer.api.myReferral()).currentDiscountPercent)
        .toBe(REFERRER_FIRST_TIER_PERCENT);

      await goToCheckout(referrer.page, offer);
      await payWithCard(referrer.page, CARDS.declined);
      await expectPaymentError(referrer.page);
      await expectNoPurchase(referrer.page, referrer.api, referrer.initialBalance);

      await goToCheckout(referrer.page, offer);
      await expectReferralDiscount(referrer.page, offer, REFERRER_FIRST_TIER_PERCENT);
      expect((await referrer.api.myReferral()).currentDiscountPercent).toBe(REFERRER_FIRST_TIER_PERCENT);
    },
  );

  test("son propre code de parrainage est refusé", async ({ offers, openBuyer }) => {
    const offer = offers.explorator;
    const self = await openBuyer({ tag: "parrain" });
    const { code } = await self.api.myReferral();

    const refused = await self.api.initReferral(code).then(
      () => undefined,
      (error: unknown) => error,
    );
    expect(refused).toBeInstanceOf(GatewayError);
    expect((refused as GatewayError).status).toBe(400);

    expect((await self.api.myReferral()).myRefereeDiscount).toBeNull();
    await goToCheckout(self.page, offer);
    await expectNoReferralDiscount(self.page, offer);
  });
});
