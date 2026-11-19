import { test as base, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
import { loginWithCredentials, muteReleaseNotes } from "@/auth";
import { env, hasKeycloakAdmin } from "@/env";
import {
  createTemporaryAccount,
  createTemporaryAdminAccount,
  deleteKeycloakAccount,
  type TemporaryAccount,
} from "@/keycloak";
import { GatewayClient, uniqueCode, type NewAffiliation, type NewPromoCode } from "@/payment";
import { loadOffers, type Pack, type PackOffer } from "@/shop";

/** Acheteur jetable connecté : son solde et ses réductions ne concernent que ce test. */
export type Buyer = {
  page: Page;
  context: BrowserContext;
  account: TemporaryAccount;
  api: GatewayClient;
  /** Solde initial (un compte neuf reçoit des tokens de bienvenue). */
  initialBalance: number;
};

type ShopFixtures = {
  /** Garde auto, évaluée avant tout compte créé : cible de la matrice, webhook Stripe, admin Keycloak. */
  shopGate: void;
  buyer: Buyer;
  offers: Record<Pack["key"], PackOffer>;
  /** Ouvre un second acheteur dans son propre contexte (ex. le parrain d'un filleul). */
  openBuyer: OpenBuyer;
  /** Crée un code promo unique (supprimé en fin de test) et renvoie son code et son id. */
  createPromo: (promo: Omit<NewPromoCode, "code" | "name">) => Promise<CreatedCode>;
  /** Crée un code d'affiliation unique (supprimé en fin de test). */
  createAffiliation: (affiliation: Pick<NewAffiliation, "userDiscountPercent">) => Promise<CreatedCode>;
};

export type CreatedCode = { id: string; code: string };

export type OpenBuyer = (options: { tag: string; landingPath?: string }) => Promise<Buyer>;

type ShopWorkerFixtures = {
  /** Client API d'un compte admin jetable (un par worker) pour créer les codes promo / affiliation. */
  adminApi: GatewayClient;
};

/**
 * Connecte un compte jetable dans un contexte neuf.
 * `landingPath` : page ouverte avant le SSO (ex. `/?ref=CODE` pour arriver par un lien de parrainage).
 */
async function signIn(
  context: BrowserContext,
  page: Page,
  account: TemporaryAccount,
  landingPath?: string,
): Promise<Buyer> {
  await muteReleaseNotes(context);
  await loginWithCredentials(page, account.username, account.password, landingPath);
  const api = await GatewayClient.login(account.username, account.password);
  return { page, context, account, api, initialBalance: await api.balance() };
}

/** Tag des tests qui attendent un paiement confirmé (crédit de tokens, consommation d'une réduction). */
export const WEBHOOK = "@webhook";
/** Tag du sous-ensemble joué sur toutes les cibles (sinon `desktop-chrome` seul). */
export const SMOKE = "@smoke";

/** Projet qui joue la matrice complète. */
const FULL_MATRIX_PROJECT = "desktop-chrome";

/**
 * Hors `desktop-chrome`, seuls les tests `@smoke` tournent :
 * la matrice complète × 5 cibles multiplierait les appels à l'API de test Stripe.
 */
function skipOutsideFullMatrix(testInfo: TestInfo): void {
  testInfo.skip(
    testInfo.project.name !== FULL_MATRIX_PROJECT && !testInfo.tags.includes(SMOKE),
    `matrice complète jouée sur ${FULL_MATRIX_PROJECT} uniquement`,
  );
}

export const test = base.extend<ShopFixtures, ShopWorkerFixtures>({
  shopGate: [
    async ({}, use, testInfo) => {
      testInfo.skip(!hasKeycloakAdmin(), "KEYCLOAK_ADMIN_* requis pour créer les comptes jetables");
      skipOutsideFullMatrix(testInfo);
      testInfo.skip(
        testInfo.tags.includes(WEBHOOK) && !env.stripeWebhook,
        "E2E_STRIPE_WEBHOOK=1 et `make stripe-listen` requis (webhook Stripe)",
      );
      await use();
    },
    { auto: true },
  ],

  adminApi: [
    async ({}, use) => {
      const admin = await createTemporaryAdminAccount("shopadmin");
      try {
        await use(await GatewayClient.login(admin.username, admin.password));
      } finally {
        await deleteKeycloakAccount(admin.username);
      }
    },
    { scope: "worker" },
  ],

  offers: async ({ adminApi }, use) => {
    await use(await loadOffers(adminApi));
  },

  buyer: async ({ page, context }, use) => {
    const account = await createTemporaryAccount("shop");
    try {
      await use(await signIn(context, page, account));
    } finally {
      await deleteKeycloakAccount(account.username);
    }
  },

  openBuyer: async ({ browser, viewport, isMobile, hasTouch, userAgent, deviceScaleFactor }, use) => {
    const opened: Array<{ context: BrowserContext; username: string }> = [];
    try {
      await use(async ({ tag, landingPath }) => {
        const account = await createTemporaryAccount(tag);
        // Même appareil que le projet en cours (écran, tactile, user-agent).
        const context = await browser.newContext({
          baseURL: env.webUrl,
          locale: env.locale,
          viewport,
          isMobile,
          hasTouch,
          userAgent,
          deviceScaleFactor,
        });
        opened.push({ context, username: account.username });
        return signIn(context, await context.newPage(), account, landingPath);
      });
    } finally {
      for (const { context, username } of opened) {
        await context.close();
        await deleteKeycloakAccount(username);
      }
    }
  },

  createPromo: async ({ adminApi }, use) => {
    const created: string[] = [];
    try {
      await use(async (promo) => {
        const code = uniqueCode("PROMO");
        const { id } = await adminApi.createPromoCode({ code, name: `[e2e] ${code}`, ...promo });
        created.push(id);
        return { id, code };
      });
    } finally {
      for (const id of created) await adminApi.deletePromoCode(id);
    }
  },

  createAffiliation: async ({ adminApi }, use) => {
    const created: string[] = [];
    try {
      await use(async ({ userDiscountPercent }) => {
        const code = uniqueCode("AFF");
        const { id } = await adminApi.createAffiliation({
          code,
          name: `[e2e] ${code}`,
          creatorName: "Créateur e2e",
          creatorCommissionPercent: 10,
          userDiscountPercent,
        });
        created.push(id);
        return { id, code };
      });
    } finally {
      for (const id of created) await adminApi.deleteAffiliation(id);
    }
  },
});

export { expect } from "@playwright/test";
