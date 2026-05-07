import apiClient from './ApiService';
import { Campaign } from '@/types/campaign';

interface GetCampaignsParams {
    page?: number;
    offset?: number;
    sort?: string;
    label?: string;
}

function parseCampaignListPayload(raw: unknown): { data: Campaign[]; totalItems?: number } {
    if (raw == null || typeof raw !== 'object') {
        return { data: [] };
    }
    const body = raw as Record<string, unknown>;
    const items = body.data;
    const data: Campaign[] = Array.isArray(items) ? (items as Campaign[]) : [];

    const pagination = body.pagination ?? body.meta;
    if (pagination != null && typeof pagination === 'object') {
        const p = pagination as Record<string, unknown>;
        const rawTotal = p.totalItems ?? p.total_items ?? p.total;
        if (typeof rawTotal === 'number' && Number.isFinite(rawTotal)) {
            return { data, totalItems: rawTotal };
        }
        if (typeof rawTotal === 'string' && rawTotal.trim() !== '') {
            const n = Number(rawTotal);
            if (Number.isFinite(n)) {
                return { data, totalItems: n };
            }
        }
    }
    return { data };
}

class CampaignService {
    private readonly BASE_PATH = '/campaigns';

    /**
     * Récupère la liste des campagnes de l'utilisateur (paginée).
     * `totalItems` peut être absent si la forme du JSON réseau diffère — le store utilise alors la taille de page.
     */
    async getCampaigns(params?: GetCampaignsParams): Promise<{
        data: Campaign[];
        totalItems?: number;
    }> {
        try {
            const response = await apiClient().get<unknown>(this.BASE_PATH, {
                params,
            });

            return parseCampaignListPayload(response.data);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            throw error;
        }
    }

    /**
     * Récupère uniquement le label d'une campagne (accessible aux joueurs de session)
     */
    async getCampaignLabel(id: string): Promise<string | null> {
        try {
            const response = await apiClient().get<{ data: { label: string | null } }>(`${this.BASE_PATH}/${id}/label`);
            return response.data.data.label;
        } catch {
            return null;
        }
    }

    /**
     * Récupère une campagne spécifique par son ID
     */
    async getCampaignById(id: string): Promise<Campaign> {
        try {
            const response = await apiClient().get<{ data: Campaign }>(`${this.BASE_PATH}/${id}`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching campaign ${id}:`, error);
            throw error;
        }
    }

    /**
     * Crée une nouvelle campagne
     */
    async createCampaign(data: { label: string; groups: { active: string[]; archived: string[] } }): Promise<Campaign> {
        try {
            const response = await apiClient().post<{ data: Campaign }>(this.BASE_PATH, data);
            return response.data.data;
        } catch (error) {
            console.error('Error creating campaign:', error);
            throw error;
        }
    }

    /**
     * Met à jour une campagne
     */
    async updateCampaign(id: string, data: Partial<{ label: string; groups: { active: string[]; archived: string[] } }>): Promise<Campaign> {
        try {
            const response = await apiClient().patch<{ data: Campaign }>(`${this.BASE_PATH}/${id}`, data);
            return response.data.data;
        } catch (error) {
            console.error(`Error updating campaign ${id}:`, error);
            throw error;
        }
    }

    /**
     * Supprime une campagne
     */
    async deleteCampaign(id: string): Promise<void> {
        try {
            await apiClient().delete(`${this.BASE_PATH}/${id}`);
        } catch (error) {
            console.error(`Error deleting campaign ${id}:`, error);
            throw error;
        }
    }
}

const campaignService = new CampaignService();

export default campaignService;
