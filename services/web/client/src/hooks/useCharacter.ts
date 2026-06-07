import { useState, useEffect, useCallback, useMemo, type Dispatch, type SetStateAction } from 'react';
import CharacterService from '@/services/CharacterService';
import { Character } from '@/types/character';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchCharactersWithoutGroupStart,
    fetchCharactersWithoutGroupSuccess,
    loadMoreCharactersWithoutGroupStart,
    loadMoreCharactersWithoutGroupSuccess,
    fetchCharactersWithoutGroupFailure,
    selectCharactersWithoutGroup,
    selectCharactersWithoutGroupLoading,
    selectCharactersWithoutGroupLoadingMore,
    selectCharactersWithoutGroupError,
    selectCharactersWithoutGroupHasMore,
    selectCharactersWithoutGroupCurrentPage,
    selectCharactersWithoutGroupLastFetch,
    clearCharacters,
} from '@/store/slices/characterSlice';

interface UseCharacterReturn {
    character: Character | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    setCharacter: Dispatch<SetStateAction<Character | null>>;
}

interface UsePlayersWithoutGroupReturn {
    characters: Character[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    loadMoreCharacters: () => Promise<void>;
    refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer un personnage par son ID
 * @param sessionCode — requis côté API pour lire une fiche d’un autre joueur pendant une session
 */
export function useCharacter(characterId: string | null, sessionCode?: string | null): UseCharacterReturn {
    const [character, setCharacter] = useState<Character | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const remoteVersion = useAppSelector((s) =>
        characterId ? ((s.session.characterSheetRemoteVersions ?? {})[characterId] ?? 0) : 0,
    );

    const fetchCharacter = useCallback(async () => {
        if (!characterId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await CharacterService.getCharacterById(characterId, { sessionCode });
            setCharacter(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch character';
            setError(errorMessage);
            console.error('Error fetching character:', err);
        } finally {
            setLoading(false);
        }
    }, [characterId, sessionCode]);

    /**
     * Chargement initial + rechargement sur synchro WS (`characterSheetRemoteVersions`).
     * Un seul effet évite les courses entre fetch initial et fetch distant.
     */
    useEffect(() => {
        if (!characterId) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        void (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await CharacterService.getCharacterById(characterId, { sessionCode });
                if (!cancelled) {
                    setCharacter(data);
                }
            } catch (err) {
                if (!cancelled) {
                    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch character';
                    setError(errorMessage);
                    console.error('Error fetching character:', err);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [characterId, sessionCode, remoteVersion]);

    return {
        character,
        loading,
        error,
        refetch: fetchCharacter,
        setCharacter,
    };
}

/**
 * Hook pour récupérer tous les joueurs sans groupe avec infinite scroll et cache persistant
 */
export function usePlayersWithoutGroup(pageSize: number = 10, options: { autoFetch?: boolean } = {}): UsePlayersWithoutGroupReturn {
    const { autoFetch = true } = options;
    const dispatch = useAppDispatch();
    const rawCharacters = useAppSelector(selectCharactersWithoutGroup);
    // Garde-fou rendu : un état persisté antérieur au dedupe côté reducer peut encore contenir des `_id` dupliqués.
    // On dédoublonne ici par sécurité pour éviter l'erreur React "two children with the same key".
    const characters = useMemo<Character[]>(() => {
        if (rawCharacters.length === 0) return rawCharacters;
        const seen = new Set<string>();
        const cleaned: Character[] = [];
        for (const character of rawCharacters) {
            if (!character?._id || seen.has(character._id)) continue;
            seen.add(character._id);
            cleaned.push(character);
        }
        return cleaned.length === rawCharacters.length ? rawCharacters : cleaned;
    }, [rawCharacters]);
    const loading = useAppSelector(selectCharactersWithoutGroupLoading);
    const loadingMore = useAppSelector(selectCharactersWithoutGroupLoadingMore);
    const error = useAppSelector(selectCharactersWithoutGroupError);
    const hasMore = useAppSelector(selectCharactersWithoutGroupHasMore);
    const currentPage = useAppSelector(selectCharactersWithoutGroupCurrentPage);
    const lastFetchWithoutGroup = useAppSelector(selectCharactersWithoutGroupLastFetch);

    /**
     * Récupère la première page des joueurs sans groupe
     */
    const fetchCharacters = useCallback(async () => {
        try {
            dispatch(fetchCharactersWithoutGroupStart());
            const response = await CharacterService.getPlayersWithoutGroup(1, pageSize);
            dispatch(fetchCharactersWithoutGroupSuccess({
                characters: response.data,
                total: response.pagination.totalItems
            }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch players without group';
            dispatch(fetchCharactersWithoutGroupFailure(errorMessage));
        }
    }, [dispatch, pageSize]);

    /**
     * Charge la page suivante des joueurs sans groupe
     */
    const loadMoreCharacters = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        try {
            dispatch(loadMoreCharactersWithoutGroupStart());
            const nextPage = currentPage + 1;
            const response = await CharacterService.getPlayersWithoutGroup(nextPage, pageSize);
            dispatch(loadMoreCharactersWithoutGroupSuccess({
                characters: response.data,
                total: response.pagination.totalItems
            }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load more characters';
            dispatch(fetchCharactersWithoutGroupFailure(errorMessage));
        }
    }, [dispatch, currentPage, pageSize, loadingMore, hasMore]);

    /**
     * Rafraîchit les données en invalidant le cache
     */
    const refetch = useCallback(async () => {
        dispatch(clearCharacters());
        return fetchCharacters();
    }, [dispatch, fetchCharacters]);

    // Chargement automatique si aucune donnée en cache
    // ⚠️ Cooldown: skip if fetched within last 3 seconds (prevents infinite loops)
    useEffect(() => {
        const now = Date.now();
        const timeSinceLastFetch = lastFetchWithoutGroup ? now - lastFetchWithoutGroup : Infinity;

        // Skip if:
        // - autoFetch is disabled
        // - Characters already loaded
        // - Currently loading
        // - Previous error
        // - Fetched within last 3 seconds (cooldown prevents loop)
        if (!autoFetch || characters.length > 0 || loading || error || timeSinceLastFetch < 3000) {
            return;
        }

        fetchCharacters();
    }, [autoFetch, characters.length, loading, error, fetchCharacters, lastFetchWithoutGroup]);

    return {
        characters,
        loading,
        loadingMore,
        error,
        hasMore,
        loadMoreCharacters,
        refetch,
    };
}
