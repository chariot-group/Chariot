import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchCampaignsStart,
    fetchCampaignsSuccess,
    loadMoreCampaignsStart,
    loadMoreCampaignsSuccess,
    fetchCampaignsFailure,
    selectCampaigns,
    selectCampaignsLoading,
    selectCampaignsLoadingMore,
    selectCampaignsError,
    selectIsCacheValid,
    selectCurrentPage,
    selectHasMore,
    selectTotal,
    invalidateCache,
    clearCampaigns,
} from '@/store/slices/campaignSlice';
import { setSelectedCampaign, selectSelectedCampaignId } from '@/store/slices/campaignContextSlice';
import { selectContextMode } from '@/store/slices/environmentSlice';
import CampaignService from '@/services/CampaignService';
import { Campaign } from '@/types/campaign';

interface UseCampaignsOptions {
    autoFetch?: boolean;
    forceRefresh?: boolean;
    pageSize?: number;
    autoSelectFirst?: boolean;
}

/**
 * Hook personnalisé pour gérer les campagnes avec infinite scroll
 * Gère le cache automatiquement pour éviter les requêtes inutiles
 */
export function useCampaigns(options: UseCampaignsOptions = {}) {
    const { autoFetch = true, forceRefresh = false, pageSize = 5, autoSelectFirst = true } = options;

    const dispatch = useAppDispatch();
    const campaigns = useAppSelector(selectCampaigns);
    const loading = useAppSelector(selectCampaignsLoading);
    const loadingMore = useAppSelector(selectCampaignsLoadingMore);
    const error = useAppSelector(selectCampaignsError);
    const isCacheValid = useAppSelector(selectIsCacheValid);
    const currentPage = useAppSelector(selectCurrentPage);
    const hasMore = useAppSelector(selectHasMore);
    const total = useAppSelector(selectTotal);
    const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
    const contextMode = useAppSelector(selectContextMode);

    /**
     * Récupère les campagnes depuis l'API (première page)
     */
    const fetchCampaigns = useCallback(async (params?: { sort?: string; label?: string }) => {
        try {
            dispatch(fetchCampaignsStart());
            const data = await CampaignService.getCampaigns({
                ...params,
                page: 1,
                offset: pageSize,
            });
            dispatch(fetchCampaignsSuccess({ campaigns: data, total: data.length }));

            // Auto-sélectionner la première campagne si option activée, aucune campagne sélectionnée, et en mode GM
            if (autoSelectFirst && data.length > 0 && !selectedCampaignId && contextMode === 'gm') {
                dispatch(setSelectedCampaign(data[0]._id));
            }

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaigns';
            dispatch(fetchCampaignsFailure(errorMessage));
            throw err;
        }
    }, [dispatch, pageSize, autoSelectFirst, selectedCampaignId, contextMode]);

    /**
     * Charge plus de campagnes (page suivante)
     */
    const loadMoreCampaigns = useCallback(async (params?: { sort?: string; label?: string }) => {
        if (!hasMore || loadingMore) return;

        try {
            dispatch(loadMoreCampaignsStart());
            const data = await CampaignService.getCampaigns({
                ...params,
                page: currentPage + 1,
                offset: pageSize,
            });
            dispatch(loadMoreCampaignsSuccess({ campaigns: data, total: total + data.length }));
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load more campaigns';
            dispatch(fetchCampaignsFailure(errorMessage));
            throw err;
        }
    }, [dispatch, currentPage, pageSize, hasMore, loadingMore, total]);

    /**
     * Rafraîchit les campagnes en invalidant d'abord le cache
     */
    const refreshCampaigns = useCallback(async () => {
        dispatch(invalidateCache());
        dispatch(clearCampaigns());
        return fetchCampaigns();
    }, [dispatch, fetchCampaigns]);

    /**
     * Vide complètement le cache des campagnes
     */
    const clearCache = useCallback(() => {
        dispatch(clearCampaigns());
    }, [dispatch]);

    /**
     * Crée une nouvelle campagne et met à jour le cache
     */
    const createCampaign = useCallback(async (data: { label: string; groups: { active: string[]; archived: string[] } }): Promise<Campaign> => {
        const newCampaign = await CampaignService.createCampaign(data);
        // Invalider le cache pour forcer un rafraîchissement
        dispatch(invalidateCache());
        return newCampaign;
    }, [dispatch]);

    /**
     * Met à jour une campagne et invalide le cache
     */
    const updateCampaign = useCallback(async (id: string, data: Partial<{ label: string; groups: { active: string[]; archived: string[] } }>): Promise<Campaign> => {
        const updatedCampaign = await CampaignService.updateCampaign(id, data);
        // Invalider le cache pour forcer un rafraîchissement
        dispatch(invalidateCache());
        return updatedCampaign;
    }, [dispatch]);

    /**
     * Supprime une campagne et invalide le cache
     */
    const deleteCampaign = useCallback(async (id: string): Promise<void> => {
        await CampaignService.deleteCampaign(id);
        // Invalider le cache pour forcer un rafraîchissement
        dispatch(invalidateCache());
    }, [dispatch]);

    /**
     * Chargement automatique avec gestion du cache
     * Pattern "stale-while-revalidate": affiche le cache puis rafraîchit en arrière-plan
     */
    useEffect(() => {
        if (autoFetch && !loading) {
            // Si on a des données en cache, on les garde affichées et on rafraîchit en arrière-plan
            if (campaigns.length > 0 && !forceRefresh) {
                // Cache présent : rafraîchir silencieusement en arrière-plan si invalide
                if (!isCacheValid) {
                    fetchCampaigns();
                }
            } else {
                // Pas de cache ou forceRefresh : charger normalement
                if (!isCacheValid || forceRefresh) {
                    fetchCampaigns();
                }
            }
        }
    }, [autoFetch, forceRefresh, isCacheValid, loading, fetchCampaigns, campaigns.length]);

    return {
        campaigns,
        loading,
        loadingMore,
        error,
        isCacheValid,
        hasMore,
        currentPage,
        total,
        fetchCampaigns,
        loadMoreCampaigns,
        refreshCampaigns,
        clearCache,
        createCampaign,
        updateCampaign,
        deleteCampaign,
    };
}
