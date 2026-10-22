import apiClient from '@/services/ApiService';
import { emitCharacterSheetUpdated } from '@/lib/sessionCharacterSyncBridge';
import { getSessionSnapshotForBroadcast } from '@/lib/sessionSnapshot';
import { Character, PaginatedCharactersResponse, Player, NPC } from '@/types/character';

type CharacterType = 'players' | 'npcs';

interface CharacterResponse {
    message: string;
    data: Character;
}

class CharacterService {
    private readonly BASE_PATH = '/characters';

    /**
     * Récupère un personnage par son ID
     * @param sessionCode — contexte session (participant ou MJ) pour accès aux fiches non possédées
     */
    async getCharacterById(characterId: string, options?: { sessionCode?: string | null }): Promise<Character> {
        try {
            const sessionCode = options?.sessionCode?.trim();
            const response = await apiClient().get<CharacterResponse>(`${this.BASE_PATH}/${characterId}`, {
                params: sessionCode ? { sessionCode } : undefined,
            });
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching character ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Crée un nouveau personnage (Player ou NPC)
     * @param type - Type de personnage ('players' ou 'npcs')
     * @param data - Données du personnage à créer
     */
    async createCharacter(type: CharacterType, data: Partial<Player> | Partial<NPC>): Promise<Player | NPC> {
        try {
            const response = await apiClient().post<CharacterResponse>(
                `${this.BASE_PATH}/${type}`,
                data
            );
            return response.data.data as Player | NPC;
        } catch (error) {
            console.error(`Error creating ${type}:`, error);
            throw error;
        }
    }

    /**
     * Met à jour un personnage (Player ou NPC)
     * @param type - Type de personnage ('players' ou 'npcs')
     * @param characterId - ID du personnage
     * @param data - Données partielles à mettre à jour
     */
    async updateCharacter(
        type: CharacterType,
        characterId: string,
        data: Partial<Player> | Partial<NPC>,
        sessionCode?: string | null,
    ): Promise<Player | NPC> {
        try {
            const code = sessionCode?.trim();
            const response = await apiClient().patch<CharacterResponse>(
                `${this.BASE_PATH}/${type}/${characterId}`,
                data,
                { params: code ? { sessionCode: code } : undefined },
            );
            const updated = response.data.data as Player | NPC;
            const snap = getSessionSnapshotForBroadcast();
            if (snap) {
                emitCharacterSheetUpdated(snap.code, characterId);
            }
            return updated;
        } catch (error) {
            console.error(`Error updating ${type} ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Supprime un personnage
     */
    async deleteCharacter(characterId: string): Promise<void> {
        try {
            await apiClient().delete(`${this.BASE_PATH}/${characterId}`);
        } catch (error) {
            console.error(`Error deleting character ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Récupère tous les joueurs sans groupe pour l'utilisateur authentifié
     */
    async getPlayersWithoutGroup(page: number = 1, offset: number = 10): Promise<PaginatedCharactersResponse> {
        try {
            const response = await apiClient().get<PaginatedCharactersResponse>(
                `${this.BASE_PATH}/players/without-group`,
                {
                    params: { page, offset }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching players without group:', error);
            throw error;
        }
    }

    /** @see FR-npc-player-link */
    async getUnlinkedNpcsWithoutGroup(page: number = 1, offset: number = 10): Promise<PaginatedCharactersResponse> {
        try {
            const response = await apiClient().get<PaginatedCharactersResponse>(
                `${this.BASE_PATH}/npcs/without-group`,
                { params: { page, offset } },
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching unlinked NPCs without group:', error);
            throw error;
        }
    }

    /** @see FR-npc-player-link */
    async getUnlinkedNpcs(page: number = 1, offset: number = 50): Promise<PaginatedCharactersResponse> {
        try {
            const response = await apiClient().get<PaginatedCharactersResponse>(
                `${this.BASE_PATH}/npcs/unlinked`,
                { params: { page, offset } },
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching unlinked NPCs:', error);
            throw error;
        }
    }

    /** @see FR-npc-player-link */
    async getNpcsByLinkedPlayers(
        playerIds: string[],
        options?: { sessionCode?: string | null },
    ): Promise<NPC[]> {
        const ids = playerIds.map((id) => id.trim()).filter((id) => id.length > 0);
        if (ids.length === 0) return [];
        try {
            const sessionCode = options?.sessionCode?.trim();
            const response = await apiClient().get<{ message: string; data: NPC[] }>(
                `${this.BASE_PATH}/npcs/by-linked-players`,
                {
                    params: {
                        playerIds: ids.join(","),
                        ...(sessionCode ? { sessionCode } : {}),
                    },
                },
            );
            return response.data.data ?? [];
        } catch (error) {
            console.error('Error fetching NPCs by linked players:', error);
            throw error;
        }
    }
}

const characterService = new CharacterService();

export default characterService;
