import { useState, useEffect } from 'react';
import CharacterService from '@/services/CharacterService';
import { Character } from '@/types/character';

interface UseCharacterReturn {
    character: Character | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer un personnage par son ID
 */
export function useCharacter(characterId: string | null): UseCharacterReturn {
    const [character, setCharacter] = useState<Character | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCharacter = async () => {
        if (!characterId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await CharacterService.getCharacterById(characterId);
            setCharacter(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch character';
            setError(errorMessage);
            console.error('Error fetching character:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCharacter();
    }, [characterId]);

    return {
        character,
        loading,
        error,
        refetch: fetchCharacter,
    };
}
