import { env, type Role } from "@/env";
import { getUserAccessToken } from "@/keycloak";

type Envelope<T> = { data: T };

export type CreatedCharacter = { _id: string; firstname: string };
export type CreatedCampaign = { _id: string; label: string };

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

  static async as(role: Role): Promise<ChariotApi> {
    return new ChariotApi(await getUserAccessToken(role), role);
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

  async leaveSession(code: string): Promise<void> {
    await this.request("POST", `/session/sessions/${code}/leave`);
  }
}
