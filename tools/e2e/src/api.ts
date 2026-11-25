import { env, hasKeycloakAdmin, type Role } from "@/env";
import { createTemporaryAdminAccount, deleteKeycloakAccount, getUserAccessToken } from "@/keycloak";
import { GatewayClient, uniqueCode } from "@/payment";

type Envelope<T> = { data: T };

export type CreatedCharacter = { _id: string; firstname: string };
export type CreatedCampaign = { _id: string; label: string };
export type CreatedGroup = { _id: string; label: string };
export type GroupSection = "active" | "archived";

/** Lien rapide de la sidebar (FR-sidebar-quick-links). `campaignId: null` = espace joueur. */
export type QuickLink = {
  _id: string;
  icon: string;
  url: string;
  label: string;
  campaignId: string | null;
  visibleInAllCampaigns?: boolean;
  visibleInPlayerSpace?: boolean;
};

/** Lien rapide préparé par l'API : titre et URL requis ; par défaut icône « Link », espace joueur, non partagé. */
export type QuickLinkSeed = Pick<QuickLink, "label" | "url"> & Partial<Omit<QuickLink, "_id" | "label" | "url">>;

/** Classe D&D d'un PJ, au format adventure (`hitDice` = taille du dé de vie). */
export type PlayerClass = { name: string; level: number; hitDice: number; hitDiceRemaining?: number };

/** Bloc d'incantation d'un PJ, au format adventure (`spellSlotsByLevel` indexé par niveau de sort). */
export type SpellcastingSeed = {
  className: string;
  ability: string;
  saveDC: number;
  attackBonus: number;
  spellSlotsByLevel: Record<string, { total: number; used: number }>;
  totalSlots: number;
  spells: unknown[];
};

/** Champs optionnels d'un PJ préparé par l'API (fusionnés avec les valeurs par défaut du formulaire web). */
export type PlayerSeed = {
  lastname?: string;
  groups?: string[];
  /** Blocs d'incantation (au moins un emplacement ou un sort ajoute la page 3 du PDF, FR-character-sheet-pdf-export). */
  spellcasting?: SpellcastingSeed[];
  background?: {
    personalityTraits?: string;
    ideals?: string;
    bonds?: string;
    flaws?: string;
    alliesAndOrgs?: string;
    backstory?: string;
  };
  class?: PlayerClass[];
  stats?: { currentHitPoints?: number; maxHitPoints?: number; tempHitPoints?: number; [key: string]: unknown };
};

/** Champs optionnels d'un PNJ préparé par l'API. `linkedPlayerId: null` délie. */
export type NpcSeed = {
  surname?: string;
  groups?: string[];
  linkedPlayerId?: string | null;
  stats?: { currentHitPoints?: number; maxHitPoints?: number; tempHitPoints?: number; [key: string]: unknown };
};

export type CharacterDetail = CreatedCharacter & {
  groups: string[];
  linkedPlayerId?: string | null;
  class?: PlayerClass[];
  stats?: { currentHitPoints?: number; maxHitPoints?: number; tempHitPoints?: number };
};

type CampaignGroups = { active?: unknown[]; archived?: unknown[] };

/** Les groupes d'une campagne arrivent en identifiants ou en objets peuplés selon l'endpoint. */
function groupIds(list: unknown[] | undefined): string[] {
  return (list ?? []).map((item) =>
    typeof item === "string" ? item : String((item as { _id?: unknown })._id ?? ""),
  );
}

/**
 * Client HTTP vers la gateway, authentifié comme un compte de test.
 * Sert à préparer les données (arrange) et à nettoyer après un scénario,
 * pour que l'UI ne soit pilotée que sur le parcours réellement testé.
 */
export class ChariotApi {
  private constructor(
    private readonly token: string,
    readonly role: Role,
  ) {}

  /** Client authentifié comme le compte `role` du worker `slot` (cf. `accountSlot`). */
  static async as(role: Role, slot: number): Promise<ChariotApi> {
    return new ChariotApi(await getUserAccessToken(role, slot), role);
  }

  private async send(method: string, path: string, body?: unknown): Promise<Response> {
    // Adventure est exposé sous `/api`, les services session et paiement directement sous `/session` et `/payment`.
    const prefix = path.startsWith("/session/") || path.startsWith("/payment/") ? "" : "/api";
    return fetch(`${env.gatewayUrl}${prefix}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await this.send(method, path, body);
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`${method} ${path} → HTTP ${response.status} ${text.slice(0, 300)}`);
    }
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  /**
   * Crée un PJ. Sans `groups`, il est rangé dans « Vos personnages » (espace joueur, FR-characters-without-group) ;
   * avec un groupe, adventure l'ajoute aussi à `group.characters` (espace MJ).
   */
  async createPlayer(firstname: string, options: PlayerSeed = {}): Promise<CreatedCharacter> {
    const { stats, ...rest } = options;
    const res = await this.request<Envelope<CreatedCharacter>>("POST", "/characters/players", {
      firstname,
      // Champs requis par le modèle adventure — mêmes valeurs par défaut que le formulaire web.
      profile: { alignment: "True Neutral" },
      // Classe requise par le formulaire web : sans elle, la fiche ne peut pas être enregistrée en édition.
      class: [{ name: "Fighter", level: 1, hitDice: 10 }],
      ...rest,
      stats: { size: "Medium", ...stats },
    });
    return res.data;
  }

  /**
   * Crée un PNJ. Sans `groups`, il est rangé dans « Vos personnages » (espace joueur) ; avec `linkedPlayerId`,
   * il devient compagnon de ce PJ (même propriétaire, FR-npc-player-link).
   */
  async createNpc(firstname: string, options: NpcSeed = {}): Promise<CreatedCharacter> {
    const { stats, ...rest } = options;
    const res = await this.request<Envelope<CreatedCharacter>>("POST", "/characters/npcs", {
      firstname,
      // Mêmes valeurs par défaut que le formulaire web de création de PNJ.
      profile: { alignment: "True Neutral" },
      challenge: { challengeRating: 0, experiencePoints: 0 },
      actions: { standard: [], legendary: [], lair: [] },
      ...rest,
      stats: { size: "Medium", maxHitPoints: 10, currentHitPoints: 10, tempHitPoints: 0, ...stats },
    });
    return res.data;
  }

  /** PATCH partiel d'un PNJ (même route que `CharacterService.updateCharacter("npcs", …)`). */
  async updateNpc(characterId: string, data: NpcSeed): Promise<void> {
    await this.request("PATCH", `/characters/npcs/${characterId}`, data);
  }

  /** PNJ du compte liés à l'un des PJ donnés (compagnons, FR-npc-player-link). */
  async npcsLinkedTo(playerIds: string[]): Promise<CharacterDetail[]> {
    const res = await this.request<{ data?: CharacterDetail[] }>(
      "GET",
      `/characters/npcs/by-linked-players?playerIds=${playerIds.join(",")}`,
    );
    return Array.isArray(res?.data) ? res.data : [];
  }

  /** PNJ sans groupe et non liés du compte (racine de « Vos personnages »), première page de 100. */
  async listNpcsWithoutGroup(): Promise<CreatedCharacter[]> {
    const res = await this.request<{ data?: CreatedCharacter[] }>("GET", "/characters/npcs/without-group?page=1&offset=100");
    return Array.isArray(res?.data) ? res.data : [];
  }

  async getCharacter(characterId: string): Promise<CharacterDetail> {
    const res = await this.request<Envelope<CharacterDetail & { groups?: unknown[] }>>(
      "GET",
      `/characters/${characterId}`,
    );
    return { ...res.data, groups: groupIds(res.data.groups) };
  }

  /** PATCH partiel d'un PJ (même route que `CharacterService.updateCharacter` côté web). */
  async updatePlayer(characterId: string, data: PlayerSeed): Promise<void> {
    await this.request("PATCH", `/characters/players/${characterId}`, data);
  }

  async deleteCharacter(characterId: string): Promise<void> {
    await this.request("DELETE", `/characters/${characterId}`);
  }

  /** PJ sans groupe du compte (« Vos personnages »), première page de 100. */
  async listPlayersWithoutGroup(): Promise<CreatedCharacter[]> {
    const res = await this.request<{ data?: CreatedCharacter[] }>(
      "GET",
      "/characters/players/without-group?page=1&offset=100",
    );
    return Array.isArray(res?.data) ? res.data : [];
  }

  /** Personnages d'un groupe (identifiant + prénom), tels que la sidebar MJ les liste. */
  async groupCharacters(groupId: string): Promise<CreatedCharacter[]> {
    const res = await this.request<Envelope<{ characters?: CreatedCharacter[] }>>("GET", `/groups/${groupId}`);
    return res.data.characters ?? [];
  }

  /** Identifiant Keycloak du compte (claim `sub` du jeton). */
  get keycloakId(): string {
    const payload = JSON.parse(Buffer.from(this.token.split(".")[1], "base64url").toString("utf8")) as { sub: string };
    return payload.sub;
  }

  /**
   * Complète le solde de wheels jusqu'à `min`, pour les scénarios qui lancent une session. Renvoie le solde final.
   * - Avec `INTERNAL_SERVICE_SECRET` (stack locale) : route interne d'adventure (`POST /user/internal/tokens`),
   *   appelée directement car la gateway retire l'en-tête interne.
   * - Sinon, avec `KEYCLOAK_ADMIN_*` (ex. integ) : commande gratuite du pack le moins cher avec un code promo
   *   à 100 % créé par un admin jetable (`creditWheelsWithFreeOrder`).
   * - Sans l'un ni l'autre : ne crédite rien.
   */
  async ensureWheels(min: number): Promise<number> {
    const balance = await this.balance();
    if (balance >= min) return balance;
    if (env.internalServiceSecret) {
      await this.creditWheelsInternally(min - balance);
    } else if (hasKeycloakAdmin()) {
      await this.creditWheelsWithFreeOrder(min - balance);
    } else {
      return balance;
    }
    return this.balance();
  }

  private async creditWheelsInternally(amount: number): Promise<void> {
    const response = await fetch(`${env.adventureUrl}/user/internal/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-service-secret": env.internalServiceSecret },
      body: JSON.stringify({ userId: this.keycloakId, amount }),
    });
    if (!response.ok) {
      throw new Error(`crédit de wheels → HTTP ${response.status} ${(await response.text().catch(() => "")).slice(0, 300)}`);
    }
  }

  /**
   * Crédite au moins `amount` wheels par le parcours réel d'achat, sans carte ni webhook Stripe :
   * un admin jetable crée un code promo à 100 % à usage unique, ce compte commande le pack le moins cher
   * (`POST /payment/stripe/free-order`), puis le code et l'admin sont supprimés.
   */
  private async creditWheelsWithFreeOrder(amount: number): Promise<void> {
    const admin = await createTemporaryAdminAccount("wheels");
    try {
      const adminApi = await GatewayClient.login(admin.username, admin.password);
      const pack = (await adminApi.products())
        .map((product) => ({
          id: product.id,
          tokens: Number(product.metadata.token_number ?? 0),
          price: product.prices[0]?.unit_amount ?? Number.POSITIVE_INFINITY,
        }))
        .filter((product) => product.tokens > 0)
        .sort((a, b) => a.price - b.price)[0];
      if (!pack) throw new Error("crédit de wheels : aucun pack avec des tokens dans le catalogue Stripe");

      const code = uniqueCode("WHEELS");
      const promo = await adminApi.createPromoCode({
        code,
        name: `[e2e] ${code}`,
        discountType: "PERCENTAGE",
        discountValue: 100,
        maxTotalUses: 1,
      });
      try {
        const quantity = Math.ceil(amount / pack.tokens);
        await this.request("POST", "/payment/stripe/free-order", {
          packId: pack.id,
          displayName: "[e2e] wheels de session",
          promoCode: code,
          ...(quantity > 1 && { quantity }),
        });
      } finally {
        await adminApi.deletePromoCode(promo.id).catch(() => undefined);
      }
    } finally {
      await deleteKeycloakAccount(admin.username);
    }
  }

  /** Solde de wheels du compte (`/user/me`, créé à la première visite de l'app). */
  async balance(): Promise<number> {
    const res = await this.request<Envelope<{ balance?: number }>>("GET", "/user/me");
    return res.data.balance ?? 0;
  }

  async listCampaigns(): Promise<CreatedCampaign[]> {
    // Défaut adventure : 10 par page, triées par dernière mise à jour.
    const res = await this.request<Envelope<CreatedCampaign[]> | CreatedCampaign[]>("GET", "/campaigns?page=1&offset=100");
    return Array.isArray(res) ? res : (res.data ?? []);
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    await this.request("DELETE", `/campaigns/${campaignId}`);
  }

  async createCampaign(label: string): Promise<CreatedCampaign> {
    const res = await this.request<Envelope<CreatedCampaign>>("POST", "/campaigns", {
      label,
      groups: { active: [], archived: [] },
    });
    return res.data;
  }

  /** Crée un groupe actif dans la campagne (même payload que `GroupService.createGroup` côté web). */
  async createGroup(campaignId: string, label: string): Promise<CreatedGroup> {
    const res = await this.request<Envelope<CreatedGroup>>("POST", "/groups", {
      label,
      campaigns: [{ idCampaign: campaignId, type: "active" }],
    });
    return res.data;
  }

  async deleteGroup(groupId: string): Promise<void> {
    await this.request("DELETE", `/groups/${groupId}`);
  }

  /** Première page (50) des groupes actifs ou archivés d'une campagne, comme la sidebar MJ. */
  async listGroups(campaignId: string, type: GroupSection): Promise<CreatedGroup[]> {
    const res = await this.request<{ data?: CreatedGroup[] }>(
      "GET",
      `/campaigns/${campaignId}/groups?type=${type}&page=1&offset=50`,
    );
    return Array.isArray(res?.data) ? res.data : [];
  }

  /**
   * Archive des groupes comme la sidebar (`useGroups.archiveGroup`) : la campagne porte
   * les listes `groups.active` / `groups.archived`, on y déplace les identifiants.
   */
  async archiveGroups(campaignId: string, ids: string[]): Promise<void> {
    const res = await this.request<Envelope<{ groups?: CampaignGroups }>>("GET", `/campaigns/${campaignId}`);
    const active = groupIds(res.data.groups?.active);
    const archived = groupIds(res.data.groups?.archived);
    await this.request("PATCH", `/campaigns/${campaignId}`, {
      groups: {
        active: active.filter((id) => !ids.includes(id)),
        archived: [...archived, ...ids.filter((id) => !archived.includes(id))],
      },
    });
  }

  async leaveSession(code: string): Promise<void> {
    await this.request("POST", `/session/sessions/${code}/leave`);
  }

  /** Crée un lien rapide (même payload que `QuickLinkService.createQuickLink` côté web). */
  async createQuickLink(seed: QuickLinkSeed): Promise<QuickLink> {
    const res = await this.request<Envelope<QuickLink>>("POST", "/quick-links", {
      icon: "Link",
      campaignId: null,
      ...seed,
    });
    return res.data;
  }

  /**
   * Liens rapides du compte. `campaignId` : ceux affichés sous cette campagne (propres + communs) ;
   * `null` : ceux de l'espace joueur ; sans argument : tous.
   */
  async listQuickLinks(campaignId?: string | null): Promise<QuickLink[]> {
    const query = campaignId === undefined ? "" : `?campaignId=${campaignId ?? "null"}`;
    const res = await this.request<Envelope<QuickLink[]>>("GET", `/quick-links${query}`);
    return res.data ?? [];
  }

  async deleteQuickLink(id: string): Promise<void> {
    await this.request("DELETE", `/quick-links/${id}`);
  }

  /** Statut HTTP brut d'un appel aux liens rapides, pour vérifier les refus (400, 403) sans lever d'erreur. */
  async quickLinkStatus(method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<number> {
    const response = await this.send(method, `/quick-links${path}`, body);
    return response.status;
  }
}
