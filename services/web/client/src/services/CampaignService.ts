import apiClient from './ApiService';
import { Campaign, PaginatedCampaignsResponse } from '@/types/campaign';

interface GetCampaignsParams {
    page?: number;
    offset?: number;
    sort?: string;
    label?: string;
}

class CampaignService {
    private readonly BASE_PATH = '/campaigns';

    /**
     * Récupère la liste des campagnes de l'utilisateur
     */
    async getCampaigns(params?: GetCampaignsParams): Promise<Campaign[]> {
        try {
            const response = await apiClient().get<PaginatedCampaignsResponse>(this.BASE_PATH, {
                params,
            });

            return response.data.data;
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            throw error;
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
