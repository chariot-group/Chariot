import { useAppDispatch } from '@/store/hooks';
import { invalidateCache as invalidateCampaignCache, clearCampaigns } from '@/store/slices/campaignSlice';
import { invalidateCache as invalidateGroupCache, clearGroups } from '@/store/slices/groupSlice';
import { invalidateCharacterCache, clearCharacters } from '@/store/slices/characterSlice';
import { useCallback } from 'react';

/**
 * Hook pour gérer l'invalidation et le rechargement du cache global
 * À utiliser quand des données doivent être rafraîchies (création, modification, suppression)
 */
export function useCacheManager() {
    const dispatch = useAppDispatch();

    /**
     * Invalide tous les caches sans effacer les données
     * Le prochain fetch rechargera les données de l'API
     */
    const invalidateAllCaches = useCallback(() => {
        dispatch(invalidateCampaignCache());
        dispatch(invalidateGroupCache());
        dispatch(invalidateCharacterCache());
    }, [dispatch]);

    /**
     * Efface complètement tous les caches et force un rechargement
     */
    const clearAllCaches = useCallback(() => {
        dispatch(clearCampaigns());
        dispatch(clearGroups());
        dispatch(clearCharacters());
    }, [dispatch]);

    /**
     * Invalide uniquement le cache des campagnes
     */
    const invalidateCampaigns = useCallback(() => {
        dispatch(invalidateCampaignCache());
    }, [dispatch]);

    /**
     * Invalide uniquement le cache des groupes
     */
    const invalidateGroups = useCallback(() => {
        dispatch(invalidateGroupCache());
    }, [dispatch]);

    /**
     * Invalide uniquement le cache des characters
     */
    const invalidateCharacters = useCallback(() => {
        dispatch(invalidateCharacterCache());
    }, [dispatch]);

    /**
     * Efface et recharge les campagnes
     */
    const refreshCampaigns = useCallback(() => {
        dispatch(clearCampaigns());
    }, [dispatch]);

    /**
     * Efface et recharge les groupes
     */
    const refreshGroups = useCallback(() => {
        dispatch(clearGroups());
    }, [dispatch]);

    /**
     * Efface et recharge les characters
     */
    const refreshCharacters = useCallback(() => {
        dispatch(clearCharacters());
    }, [dispatch]);

    return {
        // Invalidation globale
        invalidateAllCaches,
        clearAllCaches,

        // Invalidation sélective
        invalidateCampaigns,
        invalidateGroups,
        invalidateCharacters,

        // Refresh sélectif
        refreshCampaigns,
        refreshGroups,
        refreshCharacters,
    };
}
