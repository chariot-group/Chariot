import { env } from "@/env";
import { getAccessToken } from "@/keycloak";

type Envelope<T> = { data: T };

export type StripeProduct = {
  id: string;
  name: string;
  metadata: { token_number?: string; type?: string };
  prices: Array<{ unit_amount: number | null; currency: string }>;
};

export type ReferralInfo = {
  code: string;
  refereeCount: number;
  validatedRefereeCount: number;
  currentDiscountPercent: number;
  myRefereeDiscount: { available: boolean; discountPercent: number } | null;
};

export type CurrentUser = {
  balance: number;
  history: Array<{ value: number; campaignName: string; date: string }>;
};

export type NewPromoCode = {
  code: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  isFirstOrderOnly?: boolean;
  minOrderAmount?: number;
  maxTotalUses?: number;
  maxUsesPerUser?: number;
};

export type NewAffiliation = {
  code: string;
  name: string;
  creatorName: string;
  creatorCommissionPercent: number;
  userDiscountPercent: number;
};

/** Erreur HTTP de la gateway, avec le statut pour les assertions de refus. */
export class GatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Client HTTP vers la gateway pour un compte quelconque (souvent jetable).
 * - `/payment/*` : service paiement (catalogue, parrainage, codes promo / affiliation en admin) ;
 * - `/api/*` : adventure (solde et historique de tokens).
 * Sert à préparer les données et à vérifier les effets d'un achat sans repasser par l'UI.
 */
export class GatewayClient {
  private constructor(private readonly token: string) {}

  static async login(username: string, password: string): Promise<GatewayClient> {
    return new GatewayClient(await getAccessToken(username, password));
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${env.gatewayUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new GatewayError(`${method} ${path} → HTTP ${response.status} ${text.slice(0, 300)}`, response.status);
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  /** Accepte `{ data }` (enveloppe Chariot) ou l'objet nu. */
  private static unwrap<T>(res: Envelope<T> | T): T {
    return res && typeof res === "object" && "data" in res ? (res as Envelope<T>).data : (res as T);
  }

  async products(): Promise<StripeProduct[]> {
    return GatewayClient.unwrap(await this.request<Envelope<StripeProduct[]>>("GET", "/payment/stripe/products"));
  }

  /** Utilisateur adventure courant (créé à la première visite de l'app). */
  async currentUser(): Promise<CurrentUser> {
    return GatewayClient.unwrap(await this.request<Envelope<CurrentUser>>("GET", "/api/user/me"));
  }

  async balance(): Promise<number> {
    return (await this.currentUser()).balance ?? 0;
  }

  async initReferral(referralCode?: string): Promise<{ code: string; refereeDiscountApplied: boolean }> {
    return GatewayClient.unwrap(
      await this.request<Envelope<{ code: string; refereeDiscountApplied: boolean }>>(
        "POST",
        "/payment/referral/init",
        referralCode ? { referralCode } : {},
      ),
    );
  }

  async myReferral(): Promise<ReferralInfo> {
    return GatewayClient.unwrap(await this.request<Envelope<ReferralInfo>>("GET", "/payment/referral/me"));
  }

  // ── Admin (rôle `admin`) ─────────────────────────────────────────────────────

  async createPromoCode(promo: NewPromoCode): Promise<{ id: string }> {
    return GatewayClient.unwrap(await this.request<Envelope<{ id: string }>>("POST", "/payment/promo-codes", promo));
  }

  async deactivatePromoCode(id: string): Promise<void> {
    await this.request("PATCH", `/payment/promo-codes/${id}/deactivate`);
  }

  async deletePromoCode(id: string): Promise<void> {
    await this.request("DELETE", `/payment/promo-codes/${id}`);
  }

  async createAffiliation(affiliation: NewAffiliation): Promise<{ id: string }> {
    return GatewayClient.unwrap(
      await this.request<Envelope<{ id: string }>>("POST", "/payment/affiliations", affiliation),
    );
  }

  /** Nombre d'usages enregistrés (un par paiement confirmé avec ce code). */
  async affiliationUsageCount(id: string): Promise<number> {
    const res = await this.request<{ data: unknown[]; pagination?: { totalItems: number } }>(
      "GET",
      `/payment/affiliations/${id}/usages`,
    );
    return res.pagination?.totalItems ?? res.data.length;
  }

  async deactivateAffiliation(id: string): Promise<void> {
    await this.request("PATCH", `/payment/affiliations/${id}/deactivate`);
  }

  async deleteAffiliation(id: string): Promise<void> {
    await this.request("DELETE", `/payment/affiliations/${id}`);
  }
}

/** Code promo / affiliation unique (majuscules, chiffres, tirets ; ≤ 32 caractères). */
export function uniqueCode(prefix: string): string {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `E2E-${prefix}-${suffix}`.toUpperCase().slice(0, 32);
}
