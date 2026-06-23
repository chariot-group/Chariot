import { useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchGroupsStart,
    fetchGroupsSuccess,
    fetchGroupsFailure,
    loadMoreActiveGroupsStart,
    loadMoreActiveGroupsSuccess,
    loadMoreArchivedGroupsStart,
    loadMoreArchivedGroupsSuccess,
    selectActiveGroups,
    selectArchivedGroups,
    selectGroupsLoading,
    selectGroupsLoadingMoreActive,
    selectGroupsLoadingMoreArchived,
    selectGroupsError,
    selectOpenGroupId,
    selectActiveGroupsPage,
    selectArchivedGroupsPage,
    selectActiveGroupsHasMore,
    selectArchivedGroupsHasMore,
    selectGroupsCampaignId,
    selectGroupsLastFetch,
    setOpenGroup,
    clearGroups,
    invalidateCache as invalidateGroupCache,
} from '@/store/slices/groupSlice';
import { selectSelectedCampaignId } from '@/store/slices/campaignContextSlice';
import GroupService from '@/services/GroupService';
import CampaignService from '@/services/CampaignService';
import NavigationService from '@/services/NavigationService';
import { Group } from '@/types/campaign';
import { useToast } from '@/hooks/useToast';
import { usePathname, useRouter } from 'next/navigation';
import { RootState } from '@/store';
import { useStore } from 'react-redux';
import { normalizeGroupIdList } from '@/lib/normalizeGroupIdList';

const GROUPS_PAGE_SIZE = 5;

/**
 * Hook personnalisé pour gérer les groupes d'une campagne
 */
export function useGroups() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const store = useStore<RootState>();
    const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
    const activeGroups = useAppSelector(selectActiveGroups);
    const archivedGroups = useAppSelector(selectArchivedGroups);
    const loading = useAppSelector(selectGroupsLoading);
    const loadingMoreActive = useAppSelector(selectGroupsLoadingMoreActive);
    const loadingMoreArchived = useAppSelector(selectGroupsLoadingMoreArchived);
    const error = useAppSelector(selectGroupsError);
    const openGroupId = useAppSelector(selectOpenGroupId);
    const activePage = useAppSelector(selectActiveGroupsPage);
    const archivedPage = useAppSelector(selectArchivedGroupsPage);
    const hasMoreActive = useAppSelector(selectActiveGroupsHasMore);
    const hasMoreArchived = useAppSelector(selectArchivedGroupsHasMore);
    const groupsCampaignId = useAppSelector(selectGroupsCampaignId);
    const groupsLastFetch = useAppSelector(selectGroupsLastFetch);
    const { success, error: toastError } = useToast();
    const t = useTranslations('sidebar');

    /**
     * Récupère la première page des groupes actifs et archivés (en parallèle).
     */
    const fetchGroups = useCallback(async () => {
        if (!selectedCampaignId) {
            dispatch(clearGroups());
            return;
        }

        const { groupsCampaignId: cachedCampaignId } = store.getState().group;
        if (cachedCampaignId !== null && cachedCampaignId !== selectedCampaignId) {
            dispatch(clearGroups());
        }

        try {
            dispatch(fetchGroupsStart());

            const [activeRes, archivedRes] = await Promise.all([
                GroupService.getGroupsByCampaign(selectedCampaignId, {
                    page: 1,
                    offset: GROUPS_PAGE_SIZE,
                    type: 'active',
                }),
                GroupService.getGroupsByCampaign(selectedCampaignId, {
                    page: 1,
                    offset: GROUPS_PAGE_SIZE,
                    type: 'archived',
                }),
            ]);

            dispatch(
                fetchGroupsSuccess({
                    campaignId: selectedCampaignId,
                    active: activeRes.data,
                    archived: archivedRes.data,
                    pageSize: GROUPS_PAGE_SIZE,
                    activeTotal: activeRes.totalItems,
                    archivedTotal: archivedRes.totalItems,
                }),
            );
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch groups';
            dispatch(fetchGroupsFailure(errorMessage));
            throw err;
        }
    }, [dispatch, selectedCampaignId, store]);

    const loadMoreActiveGroups = useCallback(async () => {
        if (!selectedCampaignId || !hasMoreActive || loadingMoreActive) {
            return;
        }

        try {
            dispatch(loadMoreActiveGroupsStart());
            const result = await GroupService.getGroupsByCampaign(selectedCampaignId, {
                page: activePage + 1,
                offset: GROUPS_PAGE_SIZE,
                type: 'active',
            });
            dispatch(
                loadMoreActiveGroupsSuccess({
                    groups: result.data,
                    total: result.totalItems,
                    pageSize: GROUPS_PAGE_SIZE,
                }),
            );
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load more groups';
            dispatch(fetchGroupsFailure(errorMessage));
            throw err;
        }
    }, [dispatch, selectedCampaignId, hasMoreActive, loadingMoreActive, activePage]);

    const loadMoreArchivedGroups = useCallback(async () => {
        if (!selectedCampaignId || !hasMoreArchived || loadingMoreArchived) {
            return;
        }

        try {
            dispatch(loadMoreArchivedGroupsStart());
            const result = await GroupService.getGroupsByCampaign(selectedCampaignId, {
                page: archivedPage + 1,
                offset: GROUPS_PAGE_SIZE,
                type: 'archived',
            });
            dispatch(
                loadMoreArchivedGroupsSuccess({
                    groups: result.data,
                    total: result.totalItems,
                    pageSize: GROUPS_PAGE_SIZE,
                }),
            );
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load more archives';
            dispatch(fetchGroupsFailure(errorMessage));
            throw err;
        }
    }, [dispatch, selectedCampaignId, hasMoreArchived, loadingMoreArchived, archivedPage]);

    /**
     * Toggle l'ouverture d'un groupe
     */
    const toggleGroup = useCallback(
        (groupId: string) => {
            dispatch(setOpenGroup(groupId));
        },
        [dispatch],
    );

    /**
     * Ferme tous les groupes
     */
    const closeAllGroups = useCallback(() => {
        dispatch(setOpenGroup(null));
    }, [dispatch]);

    /**
     * Crée un nouveau groupe et invalide le cache
     */
    const createGroup = useCallback(
        async (data: { label: string }): Promise<Group> => {
            if (!selectedCampaignId) {
                throw new Error('No campaign selected');
            }

            const newGroup = await GroupService.createGroup(selectedCampaignId, data);
            dispatch(invalidateGroupCache());

            return newGroup;
        },
        [selectedCampaignId, dispatch],
    );

    /**
     * Rafraîchit les groupes en invalidant d'abord le cache
     */
    const refreshGroups = useCallback(async () => {
        dispatch(invalidateGroupCache());
        dispatch(clearGroups());
        return fetchGroups();
    }, [dispatch, fetchGroups]);

    /**
     * Archive un groupe : met à jour les IDs côté campagne (source de vérité complète), puis recharge la liste.
     */
    const archiveGroup = useCallback(
        async (groupId: string) => {
            if (!selectedCampaignId) {
                throw new Error('No campaign selected');
            }

            try {
                const campaign = await CampaignService.getCampaignById(selectedCampaignId);
                if (!campaign.groups?.active || !campaign.groups?.archived) {
                    console.warn('Campaign groups structure is invalid', campaign);
                    return;
                }

                const activeIds = normalizeGroupIdList(campaign.groups.active as unknown[]);
                const archivedIdsRaw = normalizeGroupIdList(campaign.groups.archived as unknown[]);

                if (!activeIds.includes(groupId)) {
                    return;
                }

                const newActiveIds = activeIds.filter((id) => id !== groupId);
                const newArchivedIds = archivedIdsRaw.includes(groupId)
                    ? archivedIdsRaw
                    : [...archivedIdsRaw, groupId];

                await CampaignService.updateCampaign(selectedCampaignId, {
                    groups: {
                        active: newActiveIds,
                        archived: newArchivedIds,
                    },
                });

                await fetchGroups();
                success(t('groupArchivedSuccess'));
            } catch (e) {
                const message = e instanceof Error ? e.message : t('groupArchiveFailed');
                toastError(message);
                throw e;
            }
        },
        [selectedCampaignId, fetchGroups, success, t, toastError],
    );

    /**
     * Désarchive un groupe
     */
    const unarchiveGroup = useCallback(
        async (groupId: string) => {
            if (!selectedCampaignId) {
                throw new Error('No campaign selected');
            }

            try {
                const campaign = await CampaignService.getCampaignById(selectedCampaignId);
                if (!campaign.groups?.active || !campaign.groups?.archived) {
                    console.warn('Campaign groups structure is invalid', campaign);
                    return;
                }

                const activeIds = normalizeGroupIdList(campaign.groups.active as unknown[]);
                const archivedIds = normalizeGroupIdList(campaign.groups.archived as unknown[]);

                if (!archivedIds.includes(groupId)) {
                    return;
                }

                const newArchivedIds = archivedIds.filter((id) => id !== groupId);
                const newActiveIds = activeIds.includes(groupId) ? activeIds : [...activeIds, groupId];

                await CampaignService.updateCampaign(selectedCampaignId, {
                    groups: {
                        active: newActiveIds,
                        archived: newArchivedIds,
                    },
                });

                await fetchGroups();
                success(t('groupUnarchivedSuccess'));
            } catch (e) {
                const message = e instanceof Error ? e.message : t('groupUnarchiveFailed');
                toastError(message);
                throw e;
            }
        },
        [selectedCampaignId, fetchGroups, success, t, toastError],
    );

    const redirectAfterDeletedGroups = useCallback(
        async (deletedGroupIds: string[]) => {
            const localeFromPath = pathname?.split('/')[1] || 'fr';
            const viewingDeletedGroup = deletedGroupIds.some((groupId) => pathname?.includes(`/groups/${groupId}`));

            if (!viewingDeletedGroup) {
                return;
            }

            try {
                const destination = await NavigationService.determinePostLoginDestination(
                    localeFromPath,
                    dispatch,
                    store.getState.bind(store),
                );

                dispatch(setOpenGroup(null));
                router.replace(destination.path);
            } catch (navigationError) {
                console.error('Failed to determine destination after group deletion:', navigationError);
                dispatch(setOpenGroup(null));
                router.replace(`/${localeFromPath}/welcome`);
            }
        },
        [dispatch, pathname, router, store],
    );

    /**
     * Supprime un groupe définitivement
     */
    const deleteGroup = useCallback(
        async (groupId: string) => {
            try {
                await GroupService.deleteGroup(groupId);

                await fetchGroups();
                await redirectAfterDeletedGroups([groupId]);

                success(t('groupDeletedSuccess'));
            } catch (e) {
                const message = e instanceof Error ? e.message : t('groupDeleteFailed');
                toastError(message);
                throw e;
            }
        },
        [fetchGroups, redirectAfterDeletedGroups, success, t, toastError],
    );

    /**
     * Supprime tous les groupes archivés de la campagne courante.
     */
    const deleteAllArchivedGroups = useCallback(async () => {
        if (!selectedCampaignId) {
            throw new Error('No campaign selected');
        }

        try {
            const campaign = await CampaignService.getCampaignById(selectedCampaignId);
            const archivedIds = normalizeGroupIdList(campaign.groups?.archived as unknown[]);

            if (archivedIds.length === 0) {
                return;
            }

            for (const groupId of archivedIds) {
                await GroupService.deleteGroup(groupId);
            }

            await fetchGroups();
            await redirectAfterDeletedGroups(archivedIds);
            success(t('allArchivedGroupsDeletedSuccess'));
        } catch (e) {
            const message = e instanceof Error ? e.message : t('allArchivedGroupsDeleteFailed');
            toastError(message);
            throw e;
        }
    }, [fetchGroups, redirectAfterDeletedGroups, selectedCampaignId, success, t, toastError]);

    useEffect(() => {
        if (!selectedCampaignId) {
            dispatch(clearGroups());
            return;
        }
        if (groupsCampaignId === selectedCampaignId && groupsLastFetch !== null) {
            return;
        }
        if (error) {
            return;
        }
        if (store.getState().group.loading) {
            return;
        }
        void fetchGroups();
    }, [selectedCampaignId, groupsCampaignId, groupsLastFetch, error, fetchGroups, dispatch, store]);

    return {
        activeGroups,
        archivedGroups,
        loading,
        loadingMoreActive,
        loadingMoreArchived,
        hasMoreActive,
        hasMoreArchived,
        error,
        openGroupId,
        fetchGroups,
        loadMoreActiveGroups,
        loadMoreArchivedGroups,
        toggleGroup,
        closeAllGroups,
        createGroup,
        refreshGroups,
        archiveGroup,
        unarchiveGroup,
        deleteGroup,
        deleteAllArchivedGroups,
    };
}
