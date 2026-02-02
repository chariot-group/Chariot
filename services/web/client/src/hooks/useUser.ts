import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchUserStart,
    fetchUserSuccess,
    fetchUserFailure,
    clearUser,
    selectUser,
    selectUserLoading,
    selectUserError,
} from '@/store/slices/userSlice';
import { useKeycloak } from '@/providers/KeycloakProvider';
import UserService from '@/services/UserService';

interface UseUserOptions {
    autoFetch?: boolean;
    forceRefresh?: boolean;
}

/**
 * Hook personnalisé pour gérer les informations de l'utilisateur connecté
 * Gère le cache automatiquement pour éviter les requêtes inutiles
 */
export function useUser(options: UseUserOptions = {}) {
    const { autoFetch = true, forceRefresh = false } = options;

    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const loading = useAppSelector(selectUserLoading);
    const error = useAppSelector(selectUserError);

    // Wait for Keycloak to be ready before fetching user
    const { loading: keycloakLoading, authenticated } = useKeycloak();

    /**
     * Récupère les informations de l'utilisateur depuis l'API
     */
    const fetchUser = useCallback(async () => {
        try {
            dispatch(fetchUserStart());
            const data = await UserService.getCurrentUser();
            dispatch(fetchUserSuccess(data));
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user';
            dispatch(fetchUserFailure(errorMessage));
            throw err;
        }
    }, [dispatch]);

    /**
     * Rafraîchit les informations de l'utilisateur
     */
    const refreshUser = useCallback(async () => {
        return fetchUser();
    }, [fetchUser]);

    /**
     * Efface les informations de l'utilisateur du cache
     */
    const clearUserCache = useCallback(() => {
        dispatch(clearUser());
    }, [dispatch]);

    // Auto-fetch when authenticated and enabled
    useEffect(() => {
        // Don't fetch if:
        // - autoFetch is disabled
        // - Keycloak is still loading
        // - User is not authenticated
        // - Already have user data and not forcing refresh
        if (!autoFetch || keycloakLoading || !authenticated) {
            return;
        }

        if (!user || forceRefresh) {
            fetchUser();
        }
    }, [autoFetch, keycloakLoading, authenticated, user, forceRefresh, fetchUser]);

    return {
        user,
        loading,
        error,
        fetchUser,
        refreshUser,
        clearUserCache,
        isAuthenticated: authenticated && !keycloakLoading,
    };
}
