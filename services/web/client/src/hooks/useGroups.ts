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
import { useToast } from '@/hooks/useToast';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Hook personnalisé pour gérer les groupes d'une campagne
 */
export function useGroups() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
    const activeGroups = useAppSelector(selectActiveGroups);
    const archivedGroups = useAppSelector(selectArchivedGroups);
    const loading = useAppSelector(selectGroupsLoading);
    const error = useAppSelector(selectGroupsError);
    const openGroupId = useAppSelector(selectOpenGroupId);
    const { success, error: toastError } = useToast();

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
        dispatch(setOpenGroup(groupId));
    }, [dispatch]);

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
     * Archive un groupe (le déplace de active vers archived pour la campagne courante)
     * Met ensuite à jour les listes localement pour une UX plus fluide.
     */
    const archiveGroup = useCallback(
        async (groupId: string) => {
            if (!selectedCampaignId) {
                throw new Error('No campaign selected');
            }

            try {
                const activeIds = activeGroups.map(group => group._id);
                const archivedIds = archivedGroups.map(group => group._id);

                if (!activeIds.includes(groupId)) {
                    return;
                }

                const newActiveIds = activeIds.filter(id => id !== groupId);
                const newArchivedIds = archivedIds.includes(groupId)
                    ? archivedIds
                    : [...archivedIds, groupId];

                await CampaignService.updateCampaign(selectedCampaignId, {
                    groups: {
                        active: newActiveIds,
                        archived: newArchivedIds,
                    },
                });

                const groupToArchive = activeGroups.find(group => group._id === groupId);
                const newActiveGroups = activeGroups.filter(group => group._id !== groupId);
                const newArchivedGroups = groupToArchive
                    ? [...archivedGroups, groupToArchive]
                    : archivedGroups;

                dispatch(fetchGroupsSuccess({ active: newActiveGroups, archived: newArchivedGroups }));
                success('Group archived');
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Failed to archive group';
                toastError(message);
                throw e;
            }
        },
        [selectedCampaignId, activeGroups, archivedGroups, dispatch, success, toastError],
    );

    /**
     * Désarchive un groupe (le déplace de archived vers active pour la campagne courante)
     * Met ensuite à jour les listes localement.
     */
    const unarchiveGroup = useCallback(
        async (groupId: string) => {
            if (!selectedCampaignId) {
                throw new Error('No campaign selected');
            }

            try {
                const activeIds = activeGroups.map(group => group._id);
                const archivedIds = archivedGroups.map(group => group._id);

                if (!archivedIds.includes(groupId)) {
                    return;
                }

                const newArchivedIds = archivedIds.filter(id => id !== groupId);
                const newActiveIds = activeIds.includes(groupId)
                    ? activeIds
                    : [...activeIds, groupId];

                await CampaignService.updateCampaign(selectedCampaignId, {
                    groups: {
                        active: newActiveIds,
                        archived: newArchivedIds,
                    },
                });

                const groupToUnarchive = archivedGroups.find(group => group._id === groupId);
                const newArchivedGroups = archivedGroups.filter(group => group._id !== groupId);
                const newActiveGroups = groupToUnarchive
                    ? [...activeGroups, groupToUnarchive]
                    : activeGroups;

                dispatch(fetchGroupsSuccess({ active: newActiveGroups, archived: newArchivedGroups }));
                success('Group unarchived');
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Failed to unarchive group';
                toastError(message);
                throw e;
            }
        },
        [selectedCampaignId, activeGroups, archivedGroups, dispatch, success, toastError],
    );

    /**
     * Supprime un groupe définitivement et met à jour les listes localement.
     */
    const deleteGroup = useCallback(
        async (groupId: string) => {
            try {
                await GroupService.deleteGroup(groupId);

                const newActiveGroups = activeGroups.filter(group => group._id !== groupId);
                const newArchivedGroups = archivedGroups.filter(group => group._id !== groupId);

                dispatch(fetchGroupsSuccess({ active: newActiveGroups, archived: newArchivedGroups }));

                const campaignIdFromPath = pathname?.match(/\/campaigns\/([^/]+)/)?.[1];
                const campaignIdForRedirect = selectedCampaignId || campaignIdFromPath;
                const localeFromPath = pathname?.split('/')[1] || 'fr';

                if (campaignIdForRedirect && pathname?.includes(`/groups/${groupId}`)) {
                    const groupWithCharacter =
                        newActiveGroups.find(group => (group.characters?.length || 0) > 0)
                        || newArchivedGroups.find(group => (group.characters?.length || 0) > 0);

                    if (groupWithCharacter && groupWithCharacter.characters[0]?._id) {
                        if (!openGroupId.includes(groupWithCharacter._id)) {
                            dispatch(setOpenGroup(groupWithCharacter._id));
                        }
                        router.replace(`/campaigns/${campaignIdForRedirect}/groups/${groupWithCharacter._id}/characters/${groupWithCharacter.characters[0]._id}`);
                    } else if (newActiveGroups.length > 0) {
                        const fallbackGroup = newActiveGroups[0];
                        if (!openGroupId.includes(fallbackGroup._id)) {
                            dispatch(setOpenGroup(fallbackGroup._id));
                        }
                        router.replace(`/campaigns/${campaignIdForRedirect}/groups/${fallbackGroup._id}/characters/new/players`);
                    } else if (newArchivedGroups.length > 0) {
                        const fallbackGroup = newArchivedGroups[0];
                        if (!openGroupId.includes(fallbackGroup._id)) {
                            dispatch(setOpenGroup(fallbackGroup._id));
                        }
                        router.replace(`/campaigns/${campaignIdForRedirect}/groups/${fallbackGroup._id}/characters/new/players`);
                    } else {
                        dispatch(setOpenGroup(null));
                        router.replace(`/${localeFromPath}`);
                    }
                }

                success('Group deleted');
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Failed to delete group';
                toastError(message);
                throw e;
            }
        },
        [activeGroups, archivedGroups, dispatch, openGroupId, pathname, router, selectedCampaignId, success, toastError],
    );

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
        archiveGroup,
        unarchiveGroup,
        deleteGroup,
    };
}
