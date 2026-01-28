import apiClient from './ApiService';
import { Group } from '@/types/campaign';

interface PaginatedGroupsResponse {
    data: Group[];
    meta: {
        total: number;
        page: number;
        offset: number;
    };
}

class GroupService {
    private readonly BASE_PATH = '/campaigns';

    /**
     * Récupère les groupes d'une campagne
     */
    async getGroupsByCampaign(campaignId: string, params?: { page?: number; offset?: number }): Promise<Group[]> {
        try {
            const response = await apiClient().get<PaginatedGroupsResponse>(`${this.BASE_PATH}/${campaignId}/groups`, {
                params,
            });

            return response.data.data;
        } catch (error) {
            console.error(`Error fetching groups for campaign ${campaignId}:`, error);
            throw error;
        }
    }

    /**
     * Récupère un groupe spécifique
     */
    async getGroupById(groupId: string): Promise<Group> {
        try {
            const response = await apiClient().get<{ data: Group }>(`/groups/${groupId}`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching group ${groupId}:`, error);
            throw error;
        }
    }

    /**
     * Crée un nouveau groupe
     */
    async createGroup(campaignId: string, data: { label: string }): Promise<Group> {
        try {
            const response = await apiClient().post<{ data: Group }>(`/groups`, {
                ...data,
                campaignId,
            });
            return response.data.data;
        } catch (error) {
            console.error('Error creating group:', error);
            throw error;
        }
    }

    /**
     * Met à jour un groupe
     */
    async updateGroup(groupId: string, data: Partial<{ label: string; players: string[] }>): Promise<Group> {
        try {
            const response = await apiClient().patch<{ data: Group }>(`/groups/${groupId}`, data);
            return response.data.data;
        } catch (error) {
            console.error(`Error updating group ${groupId}:`, error);
            throw error;
        }
    }

    /**
     * Supprime un groupe
     */
    async deleteGroup(groupId: string): Promise<void> {
        try {
            await apiClient().delete(`/groups/${groupId}`);
        } catch (error) {
            console.error(`Error deleting group ${groupId}:`, error);
            throw error;
        }
    }
}

export default new GroupService();
