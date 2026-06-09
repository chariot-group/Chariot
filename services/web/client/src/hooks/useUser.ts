import { useCallback, useEffect, useRef } from 'react';
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

    const forceRefreshDoneRef = useRef(false);

    // Auto-fetch when authenticated and enabled
    useEffect(() => {
        if (!autoFetch || keycloakLoading || !authenticated || loading) {
            return;
        }

        // forceRefresh: une seule fois par montage (évite la boucle user → fetch → user)
        if (forceRefresh) {
            if (forceRefreshDoneRef.current) {
                return;
            }
            forceRefreshDoneRef.current = true;
            void fetchUser();
            return;
        }

        if (!user && !error) {
            void fetchUser();
        }
    }, [autoFetch, keycloakLoading, authenticated, user, loading, error, forceRefresh, fetchUser]);

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
