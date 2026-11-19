import { expect, type Locator, type Page } from "@playwright/test";
import { env } from "@/env";
import type { GatewayClient } from "@/payment";

/**
 * Parcours boutique → checkout → retour (FR-stripe-checkout).
 * Sélecteurs par rôle + nom accessible (libellés FR de `messages/fr.json`).
 */

/** Pack du catalogue Stripe de test, repéré par son libellé traduit (clé `shop.<key>.name`). */
export type Pack = {
  key: "explorator" | "aventurer" | "legendary" | "custom";
  /** Libellé affiché dans la boutique et le récapitulatif. */
  label: string;
  /** Le pack à 1 token s'achète via le lien « Payer à l'unité », pas via une carte « Acheter ». */
  perUnit: boolean;
};

export const PACKS: readonly Pack[] = [
  { key: "explorator", label: "PACK EXPLORATEUR", perUnit: false },
  { key: "aventurer", label: "PACK AVENTURIER", perUnit: false },
  { key: "legendary", label: "PACK LÉGENDAIRE", perUnit: false },
  { key: "custom", label: "PACK PERSONNALISÉ", perUnit: true },
];

/** Prix et tokens d'un pack, lus dans le catalogue réel (pas de montant figé dans les tests). */
export type PackOffer = Pack & { unitAmount: number; currency: string; tokens: number };

export async function loadOffers(api: GatewayClient): Promise<Record<Pack["key"], PackOffer>> {
  const products = await api.products();
  const offers = {} as Record<Pack["key"], PackOffer>;
  for (const pack of PACKS) {
    const product = products.find((p) => p.name === `${pack.key}.name`);
    if (!product) throw new Error(`Pack « ${pack.key} » absent du catalogue Stripe de test`);
    offers[pack.key] = {
      ...pack,
      unitAmount: product.prices[0]?.unit_amount ?? 0,
      currency: product.prices[0]?.currency ?? "eur",
      tokens: Number(product.metadata.token_number ?? 0),
    };
  }
  return offers;
}

/** Même format que `formatPrice` du client web : `7,99 EUR`. */
export function formatPrice(amountInCents: number, currency = "eur"): string {
  return `${(amountInCents / 100).toFixed(2).replace(".", ",")} ${currency.toUpperCase()}`;
}

/** Cartes de test publiées par Stripe (mode test uniquement). */
export const CARDS = {
  success: "4242424242424242",
  declined: "4000000000000002",
  insufficientFunds: "4000000000009995",
  threeDSecure: "4000002760003184",
} as const;

/** Profil → « Recharger vos tokens » → boutique ouverte, offres chargées. */
export async function openShop(page: Page): Promise<Locator> {
  await page.goto(`/${env.locale}/profile`);
  await page.getByRole("button", { name: "Recharger vos tokens" }).click();
  const shop = page.getByRole("dialog", { name: "Boutique" });
  await expect(shop.getByRole("button", { name: "Acheter" }).first()).toBeVisible();
  return shop;
}

/** Choisit un pack dans la boutique et attend le checkout prêt à payer (ou à valider s'il est gratuit). */
async function choosePack(page: Page, shop: Locator, offer: PackOffer): Promise<void> {
  if (offer.perUnit) {
    await shop.getByRole("button", { name: `Payer à l'unité (${(offer.unitAmount / 100).toFixed(2)}€)` }).click();
  } else {
    const card = shop.locator(CARD).filter({ has: page.getByText(offer.label, { exact: true }) });
    await card.getByRole("button", { name: "Acheter" }).click();
  }
  await page.waitForURL((url) => url.pathname === `/${env.locale}/checkout`);
  await expect(page.getByRole("heading", { name: "Votre commande" })).toBeVisible();
  await expect(summary(page).getByText(offer.label, { exact: true })).toBeVisible();
  // PaymentIntent créé (ou commande gratuite résolue) : avant, un code appliqué peut être ignoré.
  await expect(page.getByRole("button", { name: /^(Payer |Obtenir gratuitement)/ })).toBeEnabled();
}

/** Ouvre la boutique et va jusqu'au checkout du pack. */
export async function goToCheckout(page: Page, offer: PackOffer): Promise<void> {
  await choosePack(page, await openShop(page), offer);
}

/** Carte UI (`components/ui/card.tsx`). */
const CARD = "[data-slot='card']";

function cardWithHeading(page: Page, heading: string): Locator {
  return page.locator(CARD).filter({ has: page.getByRole("heading", { name: heading }) });
}

/** Bloc « Résumé de la commande ». */
export function summary(page: Page): Locator {
  return cardWithHeading(page, "Résumé de la commande");
}

/**
 * Bloc « Code de réduction ». Les erreurs de code y sont cherchées : Next.js expose aussi
 * un annonceur de route en `role="alert"` ailleurs dans la page.
 */
function promoCard(page: Page): Locator {
  return cardWithHeading(page, "Code de réduction");
}

export function payButton(page: Page): Locator {
  return page.getByRole("button", { name: /^Payer / });
}

/** Total affiché et libellé du bouton de paiement cohérents avec le montant attendu. */
export async function expectTotal(page: Page, amountInCents: number, currency = "eur"): Promise<void> {
  const total = summary(page)
    .locator("div", { has: page.getByText("Total", { exact: true }) })
    .last();
  await expect(total).toContainText(formatPrice(amountInCents, currency));
  if (amountInCents > 0) {
    await expect(payButton(page)).toHaveText(`Payer ${formatPrice(amountInCents, currency)}`);
    await expect(payButton(page)).toBeEnabled();
  }
}

/** Saisie de carte dans le PaymentElement Stripe (iframe). */
async function fillCard(page: Page, number: string): Promise<void> {
  const form = page.frameLocator('iframe[title="Cadre de saisie sécurisé pour le paiement"]');
  await form.getByLabel("Numéro de carte").fill(number);
  await form.getByLabel("Date d'expiration").fill("12 / 34");
  await form.getByLabel("Code de sécurité").fill("123");
}

/** Saisit la carte et clique « Payer … ». */
export async function payWithCard(page: Page, number: string): Promise<void> {
  await fillCard(page, number);
  await payButton(page).click();
}

/** Réponse de la page de test 3-D Secure de Stripe. */
export async function answerThreeDSecure(page: Page, answer: "COMPLETE" | "FAIL" | "ANNULER"): Promise<void> {
  // Modale 3DS de Stripe.js (seule iframe Stripe dont l'URL est celle du challenge).
  const challengeHost = page.frameLocator('iframe[src*="three-ds-2-challenge"]');
  const challenge = challengeHost.frameLocator('iframe[name="stripe-challenge-frame"]');
  // Le bouton « Annuler » de la modale n'agit qu'une fois la page de la banque chargée.
  await expect(challenge.getByRole("button", { name: "COMPLETE" })).toBeVisible();
  if (answer === "ANNULER") {
    await challengeHost.getByRole("button", { name: "Annuler" }).click();
    return;
  }
  await challenge.getByRole("button", { name: answer }).click();
}

export async function expectPaymentSuccess(page: Page): Promise<void> {
  await page.waitForURL((url) => url.pathname === `/${env.locale}/checkout/return`);
  await expect(page.getByRole("heading", { name: "Paiement réussi !" })).toBeVisible();
}

/** Échec de paiement : message d'erreur sur le checkout, on y reste et on peut réessayer. */
export async function expectPaymentError(page: Page): Promise<void> {
  await expect(page.getByRole("alert").filter({ hasText: "Impossible d'initialiser le paiement" })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(`/${env.locale}/checkout`);
  await expect(payButton(page)).toBeEnabled();
}

/** Annulation : « Retour » quitte le checkout sans payer. */
export async function cancelCheckout(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Retour", exact: true }).click();
  await page.waitForURL((url) => url.pathname !== `/${env.locale}/checkout`);
}

/** Le webhook Stripe crédite le solde de façon asynchrone : on attend le montant attendu. */
export async function expectBalance(api: GatewayClient, expected: number): Promise<void> {
  await expect.poll(() => api.balance(), { timeout: 30_000, message: "solde après webhook Stripe" }).toBe(expected);
}

function balanceStatus(page: Page, balance: number): Locator {
  return page.getByRole("status", { name: `Solde de tokens actuel : ${balance} tokens` });
}

/** Profil : solde affiché et ligne d'achat « Boutique » dans l'historique (FR-profile-token-history). */
export async function expectProfilePurchase(page: Page, balance: number, credited: number): Promise<void> {
  await page.goto(`/${env.locale}/profile`);
  await expect(balanceStatus(page, balance)).toBeVisible();
  await expect(
    page.getByRole("listitem", { name: new RegExp(`— Boutique, ${credited} tokens crédités$`) }),
  ).toBeVisible();
}

/** Libellé technique des achats boutique dans l'historique adventure (`TOKEN_PURCHASE_CAMPAIGN_NAME`). */
const SHOP_PURCHASE_CAMPAIGN_NAME = "Shop";

/**
 * Aucun achat crédité : solde inchangé et aucune ligne « Boutique ».
 * Un paiement refusé ou abandonné ne déclenche jamais `payment_intent.succeeded` :
 * la vérification immédiate suffit, sans attente arbitraire.
 */
export async function expectNoPurchase(page: Page, api: GatewayClient, balanceBefore: number): Promise<void> {
  const user = await api.currentUser();
  expect(user.balance, "solde inchangé").toBe(balanceBefore);
  expect(user.history.filter((entry) => entry.campaignName === SHOP_PURCHASE_CAMPAIGN_NAME)).toHaveLength(0);
  await page.goto(`/${env.locale}/profile`);
  await expect(balanceStatus(page, balanceBefore)).toBeVisible();
  await expect(page.getByRole("listitem", { name: /— Boutique, / })).toHaveCount(0);
}

/** Saisit un code de réduction, l'applique et attend la réponse (code accepté ou erreur affichée). */
export async function applyCode(page: Page, code: string): Promise<void> {
  const input = page.getByRole("textbox", { name: "Code de réduction" });
  await input.fill(code);
  await expect(input).toHaveValue(code);
  await page.getByRole("button", { name: "Appliquer" }).click();
  const promo = promoCard(page);
  await expect(promo.getByRole("button", { name: "Retirer le code" }).or(promo.getByRole("alert"))).toBeVisible();
}

/** Montant après une remise en pourcentage (même arrondi que `computeDiscountedAmount`). */
export function afterPercent(amountInCents: number, percent: number): number {
  return amountInCents - Math.floor((amountInCents * percent) / 100);
}

/** Ligne de réduction du récapitulatif : « Réduction (CODE) », « Réduction parrainage » ou « Cadeau ». */
export function discountLine(page: Page, label: string): Locator {
  return summary(page)
    .locator("div")
    .filter({ has: page.getByText(label, { exact: true }) })
    .last();
}

export async function expectDiscountLine(page: Page, label: string, amountInCents: number): Promise<void> {
  await expect(discountLine(page, label)).toContainText(`-${formatPrice(amountInCents)}`);
}

/** Erreur de code sous le champ (FR-form-field-validation : annoncée par `role="alert"`). */
export function codeError(page: Page, message: string | RegExp): Locator {
  return promoCard(page).getByRole("alert").filter({ hasText: message });
}

/** Commande à 0 € : pas de carte, bouton « Obtenir gratuitement » (FR-stripe-checkout, free order). */
export async function confirmFreeOrder(page: Page): Promise<void> {
  await expect(page.getByText("Aucun paiement requis pour cette commande.")).toBeVisible();
  await expect(payButton(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Obtenir gratuitement" }).click();
}
