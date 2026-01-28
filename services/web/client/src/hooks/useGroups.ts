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
} from '@/store/slices/groupSlice';
import { selectSelectedCampaignId } from '@/store/slices/campaignContextSlice';
import { selectCampaigns } from '@/store/slices/campaignSlice';
import GroupService from '@/services/GroupService';

/**
 * Hook personnalisé pour gérer les groupes d'une campagne
 */
export function useGroups() {
    const dispatch = useAppDispatch();
    const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
    const campaigns = useAppSelector(selectCampaigns);
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

            // Récupérer la campagne pour obtenir les IDs des groupes actifs et archivés
            const campaign = campaigns.find(c => c._id === selectedCampaignId);

            if (!campaign) {
                // La campagne n'est pas encore chargée (cas du refresh avec redux-persist)
                // On retourne les groupes sans les séparer actifs/archivés
                console.warn('Campaign not loaded yet, returning all groups as active');
                dispatch(fetchGroupsSuccess({ active: allGroups, archived: [] }));
                return;
            }

            // Vérifier que campaign.groups existe et a les propriétés nécessaires
            if (!campaign.groups || !campaign.groups.active || !campaign.groups.archived) {
                console.warn('Campaign groups structure is invalid', campaign);
                dispatch(fetchGroupsSuccess({ active: [], archived: [] }));
                return;
            }

            // Séparer les groupes actifs et archivés
            const active = allGroups.filter(group =>
                campaign.groups.active.includes(group._id)
            );

            const archived = allGroups.filter(group =>
                campaign.groups.archived.includes(group._id)
            );

            dispatch(fetchGroupsSuccess({ active, archived }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch groups';
            dispatch(fetchGroupsFailure(errorMessage));
            throw err;
        }
    }, [dispatch, selectedCampaignId, campaigns]);

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
    };
}
