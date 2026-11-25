import { env, type Role } from "@/env";
import { getUserAccessToken } from "@/keycloak";

type Envelope<T> = { data: T };

export type CreatedCharacter = { _id: string; firstname: string };
export type CreatedCampaign = { _id: string; label: string };
export type CreatedGroup = { _id: string; label: string };
export type GroupSection = "active" | "archived";

/** Classe D&D d'un PJ, au format adventure (`hitDice` = taille du dé de vie). */
export type PlayerClass = { name: string; level: number; hitDice: number; hitDiceRemaining?: number };

/** Champs optionnels d'un PJ préparé par l'API (fusionnés avec les valeurs par défaut du formulaire web). */
export type PlayerSeed = {
  groups?: string[];
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

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    // Adventure est exposé sous `/api`, le service session directement sous `/session` (cf. SessionService web).
    const prefix = path.startsWith("/session/") ? "" : "/api";
    const response = await fetch(`${env.gatewayUrl}${prefix}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
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
   * Complète le solde de wheels jusqu'à `min` par la route interne d'adventure (`POST /user/internal/tokens`),
   * appelée directement (la gateway retire l'en-tête interne). Réservé à la stack locale et aux comptes de test.
   * Renvoie le solde final ; sans `INTERNAL_SERVICE_SECRET`, ne crédite rien.
   */
  async ensureWheels(min: number): Promise<number> {
    const balance = await this.balance();
    if (balance >= min || !env.internalServiceSecret) return balance;
    const response = await fetch(`${env.adventureUrl}/user/internal/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-service-secret": env.internalServiceSecret },
      body: JSON.stringify({ userId: this.keycloakId, amount: min - balance }),
    });
    if (!response.ok) {
      throw new Error(`crédit de wheels → HTTP ${response.status} ${(await response.text().catch(() => "")).slice(0, 300)}`);
    }
    return this.balance();
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
}
