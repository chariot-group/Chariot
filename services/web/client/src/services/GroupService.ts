import apiClient from './ApiService';
import { Group } from '@/types/campaign';

function parsePaginatedGroupsPayload(raw: unknown): { data: Group[]; totalItems?: number } {
    if (raw == null || typeof raw !== 'object') {
        return { data: [] };
    }
    const body = raw as Record<string, unknown>;
    const items = body.data;
    const data: Group[] = Array.isArray(items) ? (items as Group[]) : [];

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

class GroupService {
    private readonly BASE_PATH = '/campaigns';

    /**
     * Récupère une page de groupes d'une campagne (`type` : actifs, archivés ou les deux).
     * `totalItems` peut être absent si la forme du JSON diffère — le store utilise alors la taille de page.
     */
    async getGroupsByCampaign(
        campaignId: string,
        params?: {
            page?: number;
            offset?: number;
            sort?: string;
            label?: string;
            type?: 'all' | 'active' | 'archived';
            onlyWithMembers?: boolean;
        },
    ): Promise<{ data: Group[]; totalItems?: number }> {
        try {
            const response = await apiClient().get<unknown>(`${this.BASE_PATH}/${campaignId}/groups`, {
                params,
            });

            return parsePaginatedGroupsPayload(response.data);
        } catch (error) {
            console.error(`Error fetching groups for campaign ${campaignId}:`, error);
            throw error;
        }
    }

    /**
     * Récupère tous les groupes de la campagne (active + archived via `type=all`), en enchaînant les pages.
     * À utiliser pour la navigation ou tout besoin de liste complète.
     */
    async getAllGroupsByCampaign(campaignId: string): Promise<Group[]> {
        const pageSize = 50;
        let page = 1;
        const all: Group[] = [];
        let hasMore = true;

        while (hasMore) {
            const { data, totalItems } = await this.getGroupsByCampaign(campaignId, {
                page,
                offset: pageSize,
                type: 'all',
            });

            const existingIds = new Set(all.map((g) => g._id));
            for (const g of data) {
                if (!existingIds.has(g._id)) {
                    all.push(g);
                    existingIds.add(g._id);
                }
            }

            if (typeof totalItems === 'number' && Number.isFinite(totalItems) && totalItems >= 0) {
                hasMore = all.length < totalItems;
            } else {
                hasMore = data.length >= pageSize;
            }

            page += 1;
            if (data.length === 0) {
                hasMore = false;
            }
            if (page > 500) {
                console.warn('getAllGroupsByCampaign: stopped after 500 pages');
                break;
            }
        }

        return all;
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
                label: data.label,
                campaigns: [{ idCampaign: campaignId, type: 'active' }],
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

const groupService = new GroupService();

export default groupService;
