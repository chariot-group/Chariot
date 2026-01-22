import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchCampaignsStart,
    fetchCampaignsSuccess,
    fetchCampaignsFailure,
    selectCampaigns,
    selectCampaignsLoading,
    selectCampaignsError,
    selectIsCacheValid,
    invalidateCache,
    clearCampaigns,
} from '@/store/slices/campaignSlice';
import CampaignService from '@/services/CampaignService';
import { Campaign } from '@/types/campaign';

interface UseCampaignsOptions {
    autoFetch?: boolean;
    forceRefresh?: boolean;
}

/**
 * Hook personnalisé pour gérer les campagnes
 * Gère le cache automatiquement pour éviter les requêtes inutiles
 */
export function useCampaigns(options: UseCampaignsOptions = {}) {
    const { autoFetch = true, forceRefresh = false } = options;

    const dispatch = useAppDispatch();
    const campaigns = useAppSelector(selectCampaigns);
    const loading = useAppSelector(selectCampaignsLoading);
    const error = useAppSelector(selectCampaignsError);
    const isCacheValid = useAppSelector(selectIsCacheValid);

    /**
     * Récupère les campagnes depuis l'API
     */
    const fetchCampaigns = useCallback(async (params?: { page?: number; offset?: number; sort?: string; label?: string }) => {
        try {
            dispatch(fetchCampaignsStart());
            const data = await CampaignService.getCampaigns(params);
            dispatch(fetchCampaignsSuccess(data));
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaigns';
            dispatch(fetchCampaignsFailure(errorMessage));
            throw err;
        }
    }, [dispatch]);

    /**
     * Rafraîchit les campagnes en invalidant d'abord le cache
     */
    const refreshCampaigns = useCallback(async () => {
        dispatch(invalidateCache());
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
     */
    useEffect(() => {
        if (autoFetch && !loading) {
            // Ne charge que si le cache est invalide ou si forceRefresh est demandé
            if (!isCacheValid || forceRefresh) {
                fetchCampaigns();
            }
        }
    }, [autoFetch, forceRefresh, isCacheValid, loading, fetchCampaigns]);

    return {
        campaigns,
        loading,
        error,
        isCacheValid,
        fetchCampaigns,
        refreshCampaigns,
        clearCache,
        createCampaign,
        updateCampaign,
        deleteCampaign,
    };
}
