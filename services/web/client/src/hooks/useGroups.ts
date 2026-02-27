import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchGroupsStart,
    fetchGroupsSuccess,
    fetchGroupsFailure,
    selectActiveGroups,
    selectArchivedGroups,
    selectGroupsLoading,
    selectGroupsError,
    selectOpenGroupId,
    setOpenGroup,
    clearGroups,
    invalidateCache as invalidateGroupCache,
} from '@/store/slices/groupSlice';
import { selectSelectedCampaignId } from '@/store/slices/campaignContextSlice';
import GroupService from '@/services/GroupService';
import CampaignService from '@/services/CampaignService';
import { Group } from '@/types/campaign';

/**
 * Hook personnalisé pour gérer les groupes d'une campagne
 */
export function useGroups() {
    const dispatch = useAppDispatch();
    const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
    const activeGroups = useAppSelector(selectActiveGroups);
    const archivedGroups = useAppSelector(selectArchivedGroups);
    const loading = useAppSelector(selectGroupsLoading);
    const error = useAppSelector(selectGroupsError);
    const openGroupId = useAppSelector(selectOpenGroupId);

    /**
     * Récupère les groupes de la campagne sélectionnée
     */
    const fetchGroups = useCallback(async () => {
        if (!selectedCampaignId) {
            dispatch(clearGroups());
            return;
        }

        try {
            dispatch(fetchGroupsStart());

            // Récupérer tous les groupes de la campagne
            const allGroups = await GroupService.getGroupsByCampaign(selectedCampaignId);

            // Récupérer la campagne à jour depuis l'API pour obtenir les IDs des groupes actifs et archivés
            const campaign = await CampaignService.getCampaignById(selectedCampaignId);

            // Vérifier que campaign.groups existe et a les propriétés nécessaires
            if (!campaign.groups || !campaign.groups.active || !campaign.groups.archived) {
                console.warn('Campaign groups structure is invalid', campaign);
                dispatch(fetchGroupsSuccess({ active: [], archived: [] }));
                return;
            }

            // Les groupes peuvent être renvoyés soit comme IDs (string[]), soit comme objets peuplés ({ _id: string, ... })
            const normalizeIds = (items: unknown[]): string[] =>
                items
                    .map((item: any) => (typeof item === 'string' ? item : item?._id))
                    .filter((id: string | undefined): id is string => Boolean(id));

            const activeGroupIds = normalizeIds((campaign as any).groups.active || []);
            const archivedGroupIds = normalizeIds((campaign as any).groups.archived || []);

            // Séparer les groupes actifs et archivés à partir des IDs normalisés
            const active = allGroups.filter(group =>
                activeGroupIds.includes(group._id)
            );

            const archived = allGroups.filter(group =>
                archivedGroupIds.includes(group._id)
            );

            dispatch(fetchGroupsSuccess({ active, archived }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch groups';
            dispatch(fetchGroupsFailure(errorMessage));
            throw err;
        }
    }, [dispatch, selectedCampaignId]);

    /**
     * Toggle l'ouverture d'un groupe
     */
    const toggleGroup = useCallback((groupId: string) => {
        dispatch(setOpenGroup(openGroupId === groupId ? null : groupId));
    }, [dispatch, openGroupId]);

    /**
     * Ferme tous les groupes
     */
    const closeAllGroups = useCallback(() => {
        dispatch(setOpenGroup(null));
    }, [dispatch]);

    /**
     * Crée un nouveau groupe et invalide le cache
     */
    const createGroup = useCallback(async (data: { label: string }): Promise<Group> => {
        if (!selectedCampaignId) {
            throw new Error('No campaign selected');
        }

        const newGroup = await GroupService.createGroup(selectedCampaignId, data);
        // Invalider le cache pour forcer un rafraîchissement lors du prochain fetch
        dispatch(invalidateGroupCache());

        return newGroup;
    }, [selectedCampaignId, dispatch]);

    /**
     * Rafraîchit les groupes en invalidant d'abord le cache
     * (pattern aligné sur useCampaigns / refreshCampaigns)
     */
    const refreshGroups = useCallback(async () => {
        dispatch(invalidateGroupCache());
        dispatch(clearGroups());
        return fetchGroups();
    }, [dispatch, fetchGroups]);

    /**
     * Charge les groupes quand la campagne sélectionnée change
     */
    useEffect(() => {
        if (selectedCampaignId) {
            fetchGroups();
        } else {
            dispatch(clearGroups());
        }
    }, [selectedCampaignId, fetchGroups, dispatch]);

    return {
        activeGroups,
        archivedGroups,
        loading,
        error,
        openGroupId,
        fetchGroups,
        toggleGroup,
        closeAllGroups,
        createGroup,
        refreshGroups,
    };
}
