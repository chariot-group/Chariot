import { env, type Role } from "@/env";
import { getUserAccessToken } from "@/keycloak";

type Envelope<T> = { data: T };

export type CreatedCharacter = { _id: string; firstname: string };
export type CreatedCampaign = { _id: string; label: string };
export type CreatedGroup = { _id: string; label: string };
export type GroupSection = "active" | "archived";

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

  async createPlayer(firstname: string): Promise<CreatedCharacter> {
    const res = await this.request<Envelope<CreatedCharacter>>("POST", "/characters/players", {
      firstname,
      // Champs requis par le modèle adventure — mêmes valeurs par défaut que le formulaire web.
      profile: { alignment: "True Neutral" },
      stats: { size: "Medium" },
    });
    return res.data;
  }

  async deleteCharacter(characterId: string): Promise<void> {
    await this.request("DELETE", `/characters/${characterId}`);
  }

  async listCampaigns(): Promise<CreatedCampaign[]> {
    const res = await this.request<Envelope<CreatedCampaign[]> | CreatedCampaign[]>("GET", "/campaigns");
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
